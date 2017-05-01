var SurfaceNets = {};
SurfaceNets.BLOCK = false;

/**
 * Based on Mikola Lysenko SurfaceNets
 * https://github.com/mikolalysenko/isosurface
 *
 * Based on: S.F. Gibson, "Constrained Elastic Surface Nets". (1998) MERL Tech Report.
 */

// This is just the vertex number of each cube
var computeCubeEdges = function () {
  var cubeEdges = new Uint32Array(24);
  var k = 0;
  for (var i = 0; i < 8; ++i) {
    for (var j = 1; j <= 4; j <<= 1) {
      var p = i ^ j;
      if (i <= p) {
        cubeEdges[k++] = i;
        cubeEdges[k++] = p;
      }
    }
  }
  return cubeEdges;
};

var computeEdgeTable = function (cubeEdges) {
  //Initialize the intersection table.
  //  This is a 2^(cube configuration) ->  2^(edge configuration) map
  //  There is one entry for each possible cube configuration, and the output is a 12-bit vector enumerating all edges crossing the 0-level.
  var edgeTable = new Uint32Array(256);
  for (var i = 0; i < 256; ++i) {
    var em = 0;
    for (var j = 0; j < 24; j += 2) {
      var a = !!(i & (1 << cubeEdges[j]));
      var b = !!(i & (1 << cubeEdges[j + 1]));
      em |= a !== b ? (1 << (j >> 1)) : 0;
    }
    edgeTable[i] = em;
  }
  return edgeTable;
};

//Precompute edge table, like Paul Bourke does.
var cubeEdges = computeCubeEdges();
var edgeTable = computeEdgeTable(cubeEdges);

var readScalarValues = function (voxels, grid, dims, n, cols, mats) {
  var colors = voxels.colorField;
  var materials = voxels.materialField;
  var data = voxels.distanceField;

  //Read in 8 field values around this vertex and store them in an array
  //Also calculate 8-bit mask, like in marching cubes, so we can speed up sign checks later
  var c1 = 0;
  var c2 = 0;
  var c3 = 0;
  var m1 = 0;
  var m2 = 0;
  var m3 = 0;
  var invSum = 0;

  var mask = 0;
  var g = 0;
  var rx = dims[0];
  var rxy = dims[0] * dims[1];
  for (var k = 0; k < 2; ++k) {
    for (var j = 0; j < 2; ++j) {
      for (var i = 0; i < 2; ++i) {
        var id = n + i + j * rx + k * rxy;
        var id3 = id * 3;
        var p = data[id];
        grid[g] = p;
        mask |= (p < 0.0) ? (1 << g) : 0;
        g++;
        if (p !== Infinity) {
          p = Math.min(1 / Math.abs(p), 1e15);
          invSum += p;
          c1 += colors[id3] * p;
          c2 += colors[id3 + 1] * p;
          c3 += colors[id3 + 2] * p;
          m1 += materials[id3] * p;
          m2 += materials[id3 + 1] * p;
          m3 += materials[id3 + 2] * p;
        }
      }
    }
  }

  if (mask !== 0 && mask !== 0xff) {
    if (invSum > 0.0) invSum = 1.0 / invSum;
    cols.push(c1 * invSum, c2 * invSum, c3 * invSum);
    mats.push(m1 * invSum, m2 * invSum, m3 * invSum);
  }

  return mask;
};

var vTemp = [0.0, 0.0, 0.0];
var interpolateVertices = function (edgeMask, cubeEdges, grid, x, vertices) {
  vTemp[0] = vTemp[1] = vTemp[2] = 0.0;
  var edgeCount = 0;
  //For every edge of the cube...
  for (var i = 0; i < 12; ++i) {
    //Use edge mask to check if it is crossed
    if (!(edgeMask & (1 << i)))
      continue;
    ++edgeCount; //If it did, increment number of edge crossings
    if (SurfaceNets.BLOCK)
      continue;
    //Now find the point of intersection
    var e0 = cubeEdges[i << 1]; //Unpack vertices
    var e1 = cubeEdges[(i << 1) + 1];
    var g0 = grid[e0]; //Unpack grid values
    var t = g0 - grid[e1]; //Compute point of intersection
    if (Math.abs(t) < 1e-7)
      continue;
    t = g0 / t;

    //Interpolate vertices and add up intersections (this can be done without multiplying)
    for (var j = 0, k = 1; j < 3; ++j, k <<= 1) {
      var a = e0 & k;
      if (a !== (e1 & k))
        vTemp[j] += a ? 1.0 - t : t;
      else
        vTemp[j] += a ? 1.0 : 0.0;
    }
  }
  //Now we just average the edge intersections and add them to coordinate
  var s = 1.0 / edgeCount;
  for (var l = 0; l < 3; ++l)
    vTemp[l] = x[l] + s * vTemp[l];
  vertices.push(vTemp[0], vTemp[1], vTemp[2]);
};

var createFace = function (edgeMask, mask, buffer, R, m, x, faces) {
  //Now we need to add faces together, to do this we just loop over 3 basis components
  for (var i = 0; i < 3; ++i) {
    //The first three entries of the edgeMask count the crossings along the edge
    if (!(edgeMask & (1 << i)))
      continue;

    // i = axes we are point along.  iu, iv = orthogonal axes
    var iu = (i + 1) % 3;
    var iv = (i + 2) % 3;

    //If we are on a boundary, skip it
    if (x[iu] === 0 || x[iv] === 0)
      continue;

    //Otherwise, look up adjacent edges in buffer
    var du = R[iu];
    var dv = R[iv];

    //Remember to flip orientation depending on the sign of the corner.
    if (mask & 1)
      faces.push(buffer[m], buffer[m - du], buffer[m - du - dv], buffer[m - dv]);
    else
      faces.push(buffer[m], buffer[m - dv], buffer[m - du - dv], buffer[m - du]);
  }
};

SurfaceNets.computeSurface = function (voxels) {
  var dims = voxels.dims;

  var vertices = [];
  var cols = [];
  var mats = [];
  var faces = [];
  var n = 0;
  var x = new Int32Array(3);
  var R = new Int32Array([1, (dims[0] + 1), (dims[0] + 1) * (dims[1] + 1)]);
  var grid = new Float32Array(8);
  var nbBuf = 1;
  var buffer = new Int32Array(R[2] * 2);

  //March over the voxel grid
  for (x[2] = 0; x[2] < dims[2] - 1; ++x[2], n += dims[0], nbBuf ^= 1, R[2] = -R[2]) {

    //m is the pointer into the buffer we are going to use.  
    //This is slightly obtuse because javascript does not have good support for packed data structures, so we must use typed arrays :(
    //The contents of the buffer will be the indices of the vertices on the previous x/y slice of the volume
    var m = 1 + (dims[0] + 1) * (1 + nbBuf * (dims[1] + 1));

    for (x[1] = 0; x[1] < dims[1] - 1; ++x[1], ++n, m += 2) {
      for (x[0] = 0; x[0] < dims[0] - 1; ++x[0], ++n, ++m) {

        var mask = readScalarValues(voxels, grid, dims, n, cols, mats);
        //Check for early termination if cell does not intersect boundary
        if (mask === 0 || mask === 0xff)
          continue;
        //Sum up edge intersections
        var edgeMask = edgeTable[mask];
        buffer[m] = vertices.length / 3;
        interpolateVertices(edgeMask, cubeEdges, grid, x, vertices);
        createFace(edgeMask, mask, buffer, R, m, x, faces);
      }
    }
  }

  //All done!  Return the result
  return {
    colors: new Float32Array(cols),
    materials: new Float32Array(mats),
    vertices: new Float32Array(vertices),
    faces: new Uint32Array(faces)
  };
};

export default SurfaceNets;
