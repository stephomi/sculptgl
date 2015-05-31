define([
  'lib/glMatrix',
  'misc/getUrlOptions',
  'misc/Utils',
  'editor/Sculpt',
  'editor/Subdivision',
  'files/Import',
  'gui/Gui',
  'math3d/Camera',
  'math3d/Picking',
  'mesh/Background',
  'mesh/Selection',
  'mesh/Grid',
  'mesh/Mesh',
  'mesh/multiresolution/Multimesh',
  'mesh/Primitive',
  'states/States',
  'render/Contour',
  'render/Render',
  'render/Rtt',
  'render/shaders/ShaderMatcap',
  'render/WebGLCaps'
], function (glm, getUrlOptions, Utils, Sculpt, Subdivision, Import, Gui, Camera, Picking, Background, Selection, Grid, Mesh, Multimesh, Primitive, States, Contour, Render, Rtt, ShaderMatcap, WebGLCaps) {

  'use strict';

  var Scene = function () {
    this._gl = null; // webgl context
    this._canvas = document.getElementById('canvas');

    // core of the app
    this._states = new States(this); // for undo-redo
    this._sculpt = new Sculpt(this);
    this._camera = new Camera();
    this._picking = new Picking(this); // the ray picking
    this._pickingSym = new Picking(this, true); // the symmetrical picking

    // renderable stuffs
    var opts = getUrlOptions();
    this._showContour = opts.outline;
    this._showGrid = opts.grid;
    this._grid = null;
    this._background = null;
    this._selection = null; // the selection geometry (red hover circle)
    this._meshes = []; // the meshes
    this._selectMeshes = []; // multi selection
    this._mesh = null; // the selected mesh
    this._rtt = null; // rtt
    this._contour = null; // rtt for contour

    // ui stuffs
    this._focusGui = false; // if the gui is being focused
    this._gui = new Gui(this);

    this._preventRender = false; // prevent multiple render per frame
    this._drawFullScene = false; // render everything on the rtt
    this._autoMatrix = opts.scalecenter; // scale and center the imported meshes
  };

  Scene.prototype = {
    /** Initialization */
    start: function () {
      this.initWebGL();
      if (!this._gl)
        return;
      this._background = new Background(this._gl, this);
      this._selection = new Selection(this._gl);
      this._grid = new Grid(this._gl);
      this._rtt = new Rtt(this._gl);
      this._contour = new Contour(this._gl);

      this.loadTextures();
      this._gui.initGui();
      this.onCanvasResize();
      this.addSphere();
    },
    getBackground: function () {
      return this._background;
    },
    getCanvas: function () {
      return this._canvas;
    },
    getCamera: function () {
      return this._camera;
    },
    getGui: function () {
      return this._gui;
    },
    getMeshes: function () {
      return this._meshes;
    },
    getMesh: function () {
      return this._mesh;
    },
    getSelectedMeshes: function () {
      return this._selectMeshes;
    },
    getPicking: function () {
      return this._picking;
    },
    getPickingSymmetry: function () {
      return this._pickingSym;
    },
    getSculpt: function () {
      return this._sculpt;
    },
    getStates: function () {
      return this._states;
    },
    setMesh: function (mesh) {
      return this.setOrUnsetMesh(mesh);
    },
    setOrUnsetMesh: function (mesh, multiSelect) {
      if (!mesh) {
        this._selectMeshes.length = 0;
      } else if (!multiSelect) {
        this._selectMeshes.length = 0;
        this._selectMeshes.push(mesh);
      } else {
        var id = this.getIndexSelectMesh(mesh);
        if (id >= 0) {
          if (this._selectMeshes.length > 1) {
            this._selectMeshes.splice(id, 1);
            mesh = this._selectMeshes[0];
          }
        } else {
          this._selectMeshes.push(mesh);
        }
      }

      this._mesh = mesh;
      this.getGui().updateMesh();
      this.render();
      return mesh;
    },
    renderSelectOverRtt: function () {
      if (this.requestRender())
        this._drawFullScene = false;
    },
    /** Request a render */
    render: function () {
      this._drawFullScene = true;
      this.requestRender();
    },
    requestRender: function () {
      if (this._preventRender === true)
        return false; // render already requested for the next frame
      window.requestAnimationFrame(this.applyRender.bind(this));
      this._preventRender = true;
      return true;
    },
    /** Render the scene */
    applyRender: function () {
      this._preventRender = false;
      this.computeMatricesAndSort();
      var gl = this._gl;

      if (this._drawFullScene) {
        gl.disable(gl.DEPTH_TEST);
        // gl.enable(gl.CULL_FACE);

        var showContour = this._selectMeshes.length > 0 && this._showContour && this._contour.isEffective();
        if (showContour) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, this._contour.getFramebuffer());
          gl.clear(gl.COLOR_BUFFER_BIT);
          for (var s = 0, sel = this._selectMeshes, nbSel = sel.length; s < nbSel; ++s)
            sel[s].renderFlatColor(this);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._rtt.getFramebuffer());
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this._background.render();

        gl.enable(gl.DEPTH_TEST);
        if (this._showGrid)
          this._grid.render();
        for (var i = 0, meshes = this._meshes, nb = meshes.length; i < nb; ++i)
          meshes[i].render(this);

        if (showContour)
          this._contour.render();
      }

      // render to screen
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.disable(gl.DEPTH_TEST);
      this._rtt.render();
      this._selection.render(this);
    },
    /** Pre compute matrices and sort meshes */
    computeMatricesAndSort: function () {
      var meshes = this._meshes;
      var cam = this._camera;
      if (meshes.length > 0)
        cam.optimizeNearFar(this.computeBoundingBoxScene());
      this._grid.computeMatrices(cam);
      for (var i = 0, nb = meshes.length; i < nb; ++i)
        meshes[i].computeMatrices(cam);
      this._selection.computeMatrices(this);
      meshes.sort(Mesh.sortFunction);
    },
    /** Load webgl context */
    initWebGL: function () {
      var attributes = {
        antialias: false,
        stencil: true
      };
      var canvas = document.getElementById('canvas');
      var gl = this._gl = canvas.getContext('webgl', attributes) || canvas.getContext('experimental-webgl', attributes);
      if (!gl) {
        window.alert('Could not initialise WebGL. No WebGL, no SculptGL. Sorry.');
        return;
      }
      WebGLCaps.initWebGLExtensions(gl);
      if (!WebGLCaps.getWebGLExtension('OES_element_index_uint'))
        Render.ONLY_DRAW_ARRAYS = true;
      gl.viewportWidth = window.innerWidth;
      gl.viewportHeight = window.innerHeight;
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
      gl.frontFace(gl.CCW);
      gl.depthFunc(gl.LEQUAL);
      gl.cullFace(gl.BACK);
      gl.clearColor(0.033, 0.033, 0.033, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    },
    /** Load textures (preload) */
    loadTextures: function () {
      var self = this;
      var loadTex = function (path, idMaterial) {
        var mat = new Image();
        mat.src = path;
        var gl = self._gl;
        mat.onload = function () {
          var idTex = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, idTex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mat);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.bindTexture(gl.TEXTURE_2D, null);
          ShaderMatcap.textures[idMaterial] = idTex;
          self.render();
        };
      };
      for (var i = 0, mats = ShaderMatcap.matcaps, l = mats.length; i < l; ++i)
        loadTex(mats[i].path, i);

      this.initAlphaTextures();
    },
    initAlphaTextures: function () {
      var self = this;
      var alphas = Picking.ALPHAS_PATHS;
      var loadAlpha = function (alphas, id) {
        var am = new Image();
        am.src = 'resources/alpha/' + alphas[id];
        am.onload = function () {
          self.onLoadAlphaImage(am);
          if (id < alphas.length - 1)
            loadAlpha(alphas, id + 1);
        };
      };
      loadAlpha(alphas, 0);
    },
    /** Called when the window is resized */
    onCanvasResize: function () {
      var newWidth = this._gl.viewportWidth = this._camera._width = this._canvas.width;
      var newHeight = this._gl.viewportHeight = this._camera._height = this._canvas.height;

      this._background.onResize(newWidth, newHeight);
      this._rtt.onResize(newWidth, newHeight);
      this._contour.onResize(newWidth, newHeight);
      this._gl.viewport(0, 0, newWidth, newHeight);
      this._camera.updateProjection();
      this.render();
    },
    computeBoundingBoxMeshes: function (meshes) {
      var bigBound = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
      var vec3 = glm.vec3;
      var min = [0.0, 0.0, 0.0];
      var max = [0.0, 0.0, 0.0];
      for (var i = 0, l = meshes.length; i < l; ++i) {
        var bound = meshes[i].getBound();
        var mat = meshes[i].getMatrix();
        vec3.transformMat4(min, bound, mat);
        max[0] = bound[3];
        max[1] = bound[4];
        max[2] = bound[5];
        vec3.transformMat4(max, max, mat);
        if (min[0] < bigBound[0]) bigBound[0] = min[0];
        if (min[1] < bigBound[1]) bigBound[1] = min[1];
        if (min[2] < bigBound[2]) bigBound[2] = min[2];
        if (max[0] > bigBound[3]) bigBound[3] = max[0];
        if (max[1] > bigBound[4]) bigBound[4] = max[1];
        if (max[2] > bigBound[5]) bigBound[5] = max[2];
      }
      return bigBound;
    },
    computeBoundingBoxScene: function () {
      var bb = this.computeBoundingBoxMeshes(this._meshes);
      var gb = this._grid.getBound();
      if (gb[0] < bb[0]) bb[0] = gb[0];
      if (gb[1] < bb[1]) bb[1] = gb[1];
      if (gb[2] < bb[2]) bb[2] = gb[2];
      if (gb[3] > bb[3]) bb[3] = gb[3];
      if (gb[4] > bb[4]) bb[4] = gb[4];
      if (gb[5] > bb[5]) bb[5] = gb[5];
      return bb;
    },
    scaleAndCenterMeshes: function (meshes) {
      var vec3 = glm.vec3;
      var mat4 = glm.mat4;
      var box = this.computeBoundingBoxMeshes(meshes);
      var scale = Utils.SCALE / vec3.dist([box[0], box[1], box[2]], [box[3], box[4], box[5]]);

      var mCen = mat4.create();
      mat4.scale(mCen, mCen, [scale, scale, scale]);
      mat4.translate(mCen, mCen, [-(box[0] + box[3]) * 0.5, -(box[1] + box[4]) * 0.5, -(box[2] + box[5]) * 0.5]);

      for (var i = 0, l = meshes.length; i < l; ++i) {
        var mesh = meshes[i];
        var mat = mesh.getMatrix();
        mat4.mul(mat, mCen, mat);
      }
    },
    /** Load the sphere */
    addSphere: function () {
      // make a cube and subdivide it
      var mesh = new Multimesh(Primitive.createCube(this._gl));
      while (mesh.getNbFaces() < 50000)
        mesh.addLevel();
      // discard the very low res
      mesh._meshes.splice(0, 4);
      mesh._sel -= 4;

      return this.addNewMesh(mesh);
    },
    addCube: function () {
      var mesh = new Multimesh(Primitive.createCube(this._gl));
      glm.mat4.scale(mesh.getMatrix(), mesh.getMatrix(), [0.7, 0.7, 0.7]);
      Subdivision.LINEAR = true;
      while (mesh.getNbFaces() < 50000)
        mesh.addLevel();
      // discard the very low res
      mesh._meshes.splice(0, 4);
      mesh._sel -= 4;
      Subdivision.LINEAR = false;

      return this.addNewMesh(mesh);
    },
    addNewMesh: function (mesh) {
      this._meshes.push(mesh);
      this._states.pushStateAdd(mesh);
      this.setMesh(mesh);
      return mesh;
    },
    loadScene: function (fileData, fileType, autoMatrix) {
      var newMeshes;
      if (fileType === 'obj') newMeshes = Import.importOBJ(fileData, this._gl);
      else if (fileType === 'sgl') newMeshes = Import.importSGL(fileData, this._gl, this);
      else if (fileType === 'stl') newMeshes = Import.importSTL(fileData, this._gl);
      else if (fileType === 'ply') newMeshes = Import.importPLY(fileData, this._gl);
      var nbNewMeshes = newMeshes.length;
      if (nbNewMeshes === 0)
        return;

      var meshes = this._meshes;
      for (var i = 0; i < nbNewMeshes; ++i) {
        var mesh = newMeshes[i] = new Multimesh(newMeshes[i]);
        mesh.init();
        mesh.initRender();
        meshes.push(mesh);
      }

      if (autoMatrix)
        this.scaleAndCenterMeshes(newMeshes);
      this._states.pushStateAdd(newMeshes);
      this.setMesh(meshes[meshes.length - 1]);
      this._camera.resetView();
      return newMeshes;
    },
    clearScene: function () {
      this.getStates().reset();
      this.getMeshes().length = 0;
      this.getCamera().resetView();
      var opts = getUrlOptions();
      this._showGrid = opts.grid;
      this._showContour = opts.outline;
      this._autoMatrix = opts.scalecenter;
      this.setMesh(null);
      this._mouseButton = 0;
    },
    deleteCurrentSelection: function () {
      if (!this._mesh)
        return;

      this.removeMeshes(this._selectMeshes);
      this._states.pushStateRemove(this._selectMeshes.slice());
      this._selectMeshes.length = 0;
      this.setMesh(null);
    },
    removeMeshes: function (rm) {
      var meshes = this._meshes;
      for (var i = 0; i < rm.length; ++i)
        meshes.splice(this.getIndexMesh(rm[i]), 1);
    },
    getIndexMesh: function (mesh, select) {
      var meshes = select ? this._selectMeshes : this._meshes;
      var id = mesh.getID();
      for (var i = 0, nbMeshes = meshes.length; i < nbMeshes; ++i) {
        var testMesh = meshes[i];
        if (testMesh === mesh || testMesh.getID() === id)
          return i;
      }
      return -1;
    },
    getIndexSelectMesh: function (mesh) {
      return this.getIndexMesh(mesh, true);
    },
    /** Replace a mesh in the scene */
    replaceMesh: function (mesh, newMesh) {
      var index = this.getIndexMesh(mesh);
      if (index >= 0) this._meshes[index] = newMesh;
      if (this._mesh === mesh) this.setMesh(newMesh);
    },
    onLoadAlphaImage: function (img, name, tool) {
      var can = document.createElement('canvas');
      can.width = img.width;
      can.height = img.height;

      var ctx = can.getContext('2d');
      ctx.drawImage(img, 0, 0);
      var u8rgba = ctx.getImageData(0, 0, img.width, img.height).data;
      var u8lum = u8rgba.subarray(0, u8rgba.length / 4);
      for (var i = 0, j = 0, n = u8lum.length; i < n; ++i, j += 4)
        u8lum[i] = Math.round((u8rgba[j] + u8rgba[j + 1] + u8rgba[j + 2]) / 3);

      this.loadAlphaTexture(u8lum, img.width, img.height, name);

      if (!name) return;
      var id = Picking.ALPHAS.length - 1;
      var entry = {};
      entry[id] = name;
      this.getGui().addAlphaOptions(entry);
      if (tool && tool._ctrlAlpha) tool._ctrlAlpha.setValue(id);
    },
    loadAlphaTexture: function (u8, w, h, name) {
      var ans = Picking.ALPHAS_NAMES;
      ans.push(name || 'alpha_' + ans.length);
      return Picking.addAlpha(u8, w, h);
    }
  };

  return Scene;
});