var MeshData = function () {
  return {
    _nbVertices: 0,
    _nbFaces: 0,
    _nbTexCoords: 0,

    /////////////////////
    // unique vertex data
    /////////////////////

    _verticesXYZ: null, // vertices (Float32Array)
    _normalsXYZ: null, // normals (Float32Array)
    _colorsRGB: null, // color vertices (Float32Array)
    _materialsPBR: null, // pbr vertex data (Float32Array) roughness/metallic/masking

    _vertOnEdge: null, // (1 :> on edge, 0 otherwise) (Uint8ClampedArray)
    _vertRingFace: null, // array of neighborhood id faces (Uint32Array)
    _vrfStartCount: null, // reference vertRingFace start and count ring (start/count) (Uint32Array)
    _vrvStartCount: null, // array of neighborhood id vertices (start/count) (Uint32Array)
    _vertRingVert: null, // reference vertRingVert start and count ring (Uint32Array)

    _vertTagFlags: null, // general purposes flag, (<: Utils.TAG_FLAG) (Int32Array)
    _vertSculptFlags: null, // editing flag (tag vertices when starting sculpting session) (<: Utils.SCULPT_FLAG) (Int32Array),
    _vertStateFlags: null, // state flag (tag vertices to handle undo/redo) (<: Utils.STATE_FLAG) (Int32Array)

    _vertProxy: null, // vertex proxy, for sculpting limits (Float32Array)

    ///////////////////
    // unique face data
    ///////////////////

    _facesABCD: null, // faces tri or quad, tri will have D:Utils.TRI_INDEX (Uint32Array)

    _faceEdges: null, // each face references the id edges (Uint32Array)
    _faceNormalsXYZ: null, // faces normals (Float32Array)

    _facesToTriangles: null, // faces to triangles (Uint32Array)
    _trianglesABC: null, // triangles (Uint32Array)

    _facesTagFlags: null, // triangles tag (<: Utils.TAG_FLAG) (Int32Array)

    ////////////
    // edge data
    ////////////
    _edges: null, // edges (Uint8Array) (1 :> outer edge, 0 or 2 :> inner edge, >:3 non manifold)

    /////////////////
    // wireframe data
    /////////////////

    _drawArraysWireframe: null, // array for the wireframe (base on drawArrays vertices)
    _drawElementsWireframe: null, // array for the wireframe (base on drawElements vertices)

    //////////
    // UV data
    //////////

    _texCoordsST: null, // tex coords (Float32Array)
    _duplicateStartCount: null, // array of vertex duplicates location (start/count) (Uint32Array)
    _UVfacesABCD: null, // faces unwrap (Uint32Array)
    _UVtrianglesABC: null, // triangles tex coords (Uint32Array)

    //////////////////
    // DrawArrays data
    //////////////////

    _DAverticesXYZ: null, // vertices (Float32Array)
    _DAnormalsXYZ: null, // normals (Float32Array)
    _DAcolorsRGB: null, // color vertices (Float32Array)
    _DAmaterialsPBR: null, // material vertices (Float32Array)
    _DAtexCoordsST: null, // texCoords (Float32Array)

    //////////////
    // Octree data
    //////////////

    _octree: null, // root octree cell

    _faceBoxes: null, // faces bbox (Float32Array)
    _faceCentersXYZ: null, // faces center (Float32Array)

    _facePosInLeaf: null, // position index in the leaf (Uint32Array)
    _faceLeaf: [], // octree leaf
    _leavesToUpdate: [], // leaves of the octree to check

    _worldBound: [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity],
  };
};

export default MeshData;
