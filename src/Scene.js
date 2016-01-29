define(function (require, exports, module) {

  'use strict';

  var glm = require('lib/glMatrix');
  var getOptionsURL = require('misc/getOptionsURL');
  var Utils = require('misc/Utils');
  var Sculpt = require('editing/Sculpt');
  var Subdivision = require('editing/Subdivision');
  var Import = require('files/Import');
  var Gui = require('gui/Gui');
  var Camera = require('math3d/Camera');
  var Picking = require('math3d/Picking');
  var Background = require('drawables/Background');
  var Selection = require('drawables/Selection');
  var Mesh = require('mesh/Mesh');
  var Multimesh = require('mesh/multiresolution/Multimesh');
  var Primitives = require('drawables/Primitives');
  var States = require('states/States');
  var Render = require('mesh/Render');
  var Rtt = require('drawables/Rtt');
  var Shader = require('render/ShaderLib');
  var WebGLCaps = require('render/WebGLCaps');

  var vec3 = glm.vec3;
  var mat4 = glm.mat4;

  var Scene = function () {
    this._gl = null; // webgl context

    // cache canvas stuffs
    this._pixelRatio = 1.0;
    this._viewport = document.getElementById('viewport');
    this._canvas = document.getElementById('canvas');
    this._canvasWidth = 0;
    this._canvasHeight = 0;
    this._canvasOffsetLeft = 0;
    this._canvasOffsetTop = 0;

    // core of the app
    this._states = new States(this); // for undo-redo
    this._sculpt = null;
    this._camera = new Camera(this);
    this._picking = new Picking(this); // the ray picking
    this._pickingSym = new Picking(this, true); // the symmetrical picking

    // TODO primitive builder
    this._meshPreview = null;
    this._torusLength = 0.5;
    this._torusWidth = 0.1;
    this._torusRadius = Math.PI * 2;
    this._torusRadial = 32;
    this._torusTubular = 128;

    // renderable stuffs
    var opts = getOptionsURL();
    this._showContour = opts.outline;
    this._showGrid = opts.grid;
    this._grid = null;
    this._background = null;
    this._selection = null; // the selection geometry (red hover circle)
    this._meshes = []; // the meshes
    this._selectMeshes = []; // multi selection
    this._mesh = null; // the selected mesh

    this._rttContour = null; // rtt for contour
    this._rttMerge = null; // rtt decode opaque + merge transparent
    this._rttOpaque = null; // rtt half float
    this._rttTransparent = null; // rtt rgbm

    // ui stuffs
    this._focusGui = false; // if the gui is being focused
    this._gui = new Gui(this);

    this._preventRender = false; // prevent multiple render per frame
    this._drawFullScene = false; // render everything on the rtt
    this._autoMatrix = opts.scalecenter; // scale and center the imported meshes
    this._vertexSRGB = true; // srgb vs linear colorspace for vertex color
  };

  Scene.prototype = {
    start: function () {
      this.initWebGL();
      if (!this._gl)
        return;

      this._sculpt = new Sculpt(this);
      this._selection = new Selection(this._gl);
      this._background = new Background(this._gl, this);

      this._rttContour = new Rtt(this._gl, 'CONTOUR', null);
      this._rttMerge = new Rtt(this._gl, 'MERGE', null);
      this._rttOpaque = new Rtt(this._gl, 'FXAA');
      this._rttTransparent = new Rtt(this._gl, '', this._rttOpaque.getDepth(), true);

      this._grid = Primitives.createGrid(this._gl);
      this.initGrid();

      this.loadTextures();
      this._gui.initGui();
      this.onCanvasResize();
      this.addSphere();
    },
    getBackground: function () {
      return this._background;
    },
    getViewport: function () {
      return this._viewport;
    },
    getCanvas: function () {
      return this._canvas;
    },
    getPixelRatio: function () {
      return this._pixelRatio;
    },
    getCanvasWidth: function () {
      return this._canvasWidth;
    },
    getCanvasHeight: function () {
      return this._canvasHeight;
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
    getSelectionRadius: function () {
      return this._selection;
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
    setCanvasCursor: function (style) {
      this._canvas.style.cursor = style;
    },
    initGrid: function () {
      var grid = this._grid;
      grid.normalizeSize();
      var gridm = grid.getMatrix();
      mat4.translate(gridm, gridm, [0.0, -0.45, 0.0]);
      var scale = 2.5;
      mat4.scale(gridm, gridm, [scale, scale, scale]);
      this._grid.setShaderName('FLAT');
      grid.setFlatColor([0.2140, 0.2140, 0.2140]);
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
      if (this._requestRender())
        this._drawFullScene = false;
    },
    _requestRender: function () {
      if (this._preventRender === true)
        return false; // render already requested for the next frame

      window.requestAnimationFrame(this.applyRender.bind(this));
      this._preventRender = true;
      return true;
    },
    render: function () {
      this._drawFullScene = true;
      this._requestRender();
    },
    applyRender: function () {
      this._preventRender = false;
      this.updateMatricesAndSort();

      var gl = this._gl;
      if (!gl) return;

      if (this._drawFullScene) this._drawScene();

      gl.disable(gl.DEPTH_TEST);

      gl.bindFramebuffer(gl.FRAMEBUFFER, this._rttMerge.getFramebuffer());
      this._rttMerge.render(this); // merge + decode

      // render to screen
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      this._rttOpaque.render(this); // fxaa
      this._selection.render(this);

      gl.enable(gl.DEPTH_TEST);

      this._sculpt.postRender(); // draw sculpt gizmos
    },
    _drawScene: function () {
      var gl = this._gl;
      var i = 0;
      var meshes = this._meshes;
      var nbMeshes = meshes.length;

      ///////////////
      // CONTOUR 1/2
      ///////////////
      gl.disable(gl.DEPTH_TEST);
      var showContour = this._selectMeshes.length > 0 && this._showContour && Shader.CONTOUR.color[3] > 0.0;
      if (showContour) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._rttContour.getFramebuffer());
        gl.clear(gl.COLOR_BUFFER_BIT);
        for (var s = 0, sel = this._selectMeshes, nbSel = sel.length; s < nbSel; ++s)
          sel[s].renderFlatColor(this);
      }
      gl.enable(gl.DEPTH_TEST);

      ///////////////
      // OPAQUE PASS
      ///////////////
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._rttOpaque.getFramebuffer());
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // grid
      if (this._showGrid) this._grid.render(this);

      // (post opaque pass)
      for (i = 0; i < nbMeshes; ++i) {
        if (meshes[i].isTransparent()) break;
        meshes[i].render(this);
      }
      var startTransparent = i;
      if (this._meshPreview) this._meshPreview.render(this);

      // background
      this._background.render();

      ///////////////
      // TRANSPARENT PASS
      ///////////////
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._rttTransparent.getFramebuffer());
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.enable(gl.BLEND);
      for (i = 0; i < nbMeshes; ++i) {
        if (meshes[i].getShowWireframe())
          meshes[i].renderWireframe(this);
      }

      gl.depthMask(false);
      gl.enable(gl.CULL_FACE);

      for (i = startTransparent; i < nbMeshes; ++i) {
        gl.cullFace(gl.FRONT); // draw back first
        meshes[i].render(this);
        gl.cullFace(gl.BACK); // ... and then front
        meshes[i].render(this);
      }

      gl.disable(gl.CULL_FACE);

      ///////////////
      // CONTOUR 2/2
      ///////////////
      if (showContour) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._rttOpaque.getFramebuffer());
        this._rttContour.render(this);
      }

      gl.depthMask(true);
      gl.disable(gl.BLEND);
    },
    /** Pre compute matrices and sort meshes */
    updateMatricesAndSort: function () {
      var meshes = this._meshes;
      var cam = this._camera;
      if (meshes.length > 0)
        cam.optimizeNearFar(this.computeBoundingBoxScene());
      for (var i = 0, nb = meshes.length; i < nb; ++i)
        meshes[i].updateMatrices(cam);
      meshes.sort(Mesh.sortFunction);

      if (this._meshPreview)
        this._meshPreview.updateMatrices(cam);
      if (this._grid)
        this._grid.updateMatrices(cam);
    },
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

      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);

      gl.disable(gl.CULL_FACE);
      gl.frontFace(gl.CCW);
      gl.cullFace(gl.BACK);

      gl.disable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      gl.disable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.depthMask(true);

      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    },
    /** Load textures (preload) */
    loadTextures: function () {
      var self = this;
      var gl = this._gl;
      var ShaderMatcap = Shader.MATCAP;

      var loadTex = function (path, idMaterial) {
        var mat = new Image();
        mat.src = path;

        mat.onload = function () {
          ShaderMatcap.createTexture(gl, mat, idMaterial);
          self.render();
        };
      };

      for (var i = 0, mats = ShaderMatcap.matcaps, l = mats.length; i < l; ++i)
        loadTex(mats[i].path, i);

      this.initAlphaTextures();
    },
    initAlphaTextures: function () {
      var alphas = Picking.INIT_ALPHAS_PATHS;
      var names = Picking.INIT_ALPHAS_NAMES;
      for (var i = 0, nbA = alphas.length; i < nbA; ++i) {
        var am = new Image();
        am.src = 'resources/alpha/' + alphas[i];
        am.onload = this.onLoadAlphaImage.bind(this, am, names[i]);
      }
    },
    /** Called when the window is resized */
    onCanvasResize: function () {
      var viewport = this._viewport;
      var newWidth = viewport.clientWidth * this._pixelRatio;
      var newHeight = viewport.clientHeight * this._pixelRatio;

      this._canvasOffsetLeft = viewport.offsetLeft;
      this._canvasOffsetTop = viewport.offsetTop;
      this._canvasWidth = newWidth;
      this._canvasHeight = newHeight;

      this._canvas.width = newWidth;
      this._canvas.height = newHeight;

      this._gl.viewport(0, 0, newWidth, newHeight);
      this._camera.onResize(newWidth, newHeight);
      this._background.onResize(newWidth, newHeight);

      this._rttContour.onResize(newWidth, newHeight);
      this._rttMerge.onResize(newWidth, newHeight);
      this._rttOpaque.onResize(newWidth, newHeight);
      this._rttTransparent.onResize(newWidth, newHeight);

      this.render();
    },
    computeBoundingBoxMeshes: function (meshes) {
      var bound = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
      for (var i = 0, l = meshes.length; i < l; ++i) {
        var bi = meshes[i].getWorldBound();
        if (bi[0] < bound[0]) bound[0] = bi[0];
        if (bi[1] < bound[1]) bound[1] = bi[1];
        if (bi[2] < bound[2]) bound[2] = bi[2];
        if (bi[3] > bound[3]) bound[3] = bi[3];
        if (bi[4] > bound[4]) bound[4] = bi[4];
        if (bi[5] > bound[5]) bound[5] = bi[5];
      }
      return bound;
    },
    computeBoundingBoxScene: function () {
      var scene = this._meshes.slice();
      scene.push(this._grid);
      this._sculpt.addSculptToScene(scene);
      return this.computeBoundingBoxMeshes(scene);
    },
    normalizeAndCenterMeshes: function (meshes) {
      var box = this.computeBoundingBoxMeshes(meshes);
      var scale = Utils.SCALE / vec3.dist([box[0], box[1], box[2]], [box[3], box[4], box[5]]);

      var mCen = mat4.create();
      mat4.scale(mCen, mCen, [scale, scale, scale]);
      mat4.translate(mCen, mCen, [-(box[0] + box[3]) * 0.5, -(box[1] + box[4]) * 0.5, -(box[2] + box[5]) * 0.5]);

      for (var i = 0, l = meshes.length; i < l; ++i) {
        var mat = meshes[i].getMatrix();
        mat4.mul(mat, mCen, mat);
      }
    },
    addSphere: function () {
      // make a cube and subdivide it
      var mesh = new Multimesh(Primitives.createCube(this._gl));
      mesh.normalizeSize();
      this.subdivideClamp(mesh);
      return this.addNewMesh(mesh);
    },
    addCube: function () {
      var mesh = new Multimesh(Primitives.createCube(this._gl));
      mesh.normalizeSize();
      mat4.scale(mesh.getMatrix(), mesh.getMatrix(), [0.7, 0.7, 0.7]);
      this.subdivideClamp(mesh, true);
      return this.addNewMesh(mesh);
    },
    addCylinder: function () {
      var mesh = new Multimesh(Primitives.createCylinder(this._gl));
      mesh.normalizeSize();
      mat4.scale(mesh.getMatrix(), mesh.getMatrix(), [0.7, 0.7, 0.7]);
      this.subdivideClamp(mesh);
      return this.addNewMesh(mesh);
    },
    addTorus: function (preview) {
      var mesh = new Multimesh(Primitives.createTorus(this._gl, this._torusLength, this._torusWidth, this._torusRadius, this._torusRadial, this._torusTubular));
      if (preview) {
        mesh.setShowWireframe(true);
        var scale = 0.3 * Utils.SCALE;
        mat4.scale(mesh.getMatrix(), mesh.getMatrix(), [scale, scale, scale]);
        this._meshPreview = mesh;
        return;
      }
      mesh.normalizeSize();
      this.subdivideClamp(mesh);
      this.addNewMesh(mesh);
    },
    subdivideClamp: function (mesh, linear) {
      Subdivision.LINEAR = !!linear;
      while (mesh.getNbFaces() < 50000)
        mesh.addLevel();
      // keep at max 4 multires
      mesh._meshes.splice(0, Math.min(mesh._meshes.length - 4, 4));
      mesh._sel = mesh._meshes.length - 1;
      Subdivision.LINEAR = false;
    },
    addNewMesh: function (mesh) {
      this._meshes.push(mesh);
      this._states.pushStateAdd(mesh);
      this.setMesh(mesh);
      return mesh;
    },
    loadScene: function (fileData, fileType) {
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

        if (!this._vertexSRGB)
          Utils.convertArrayVec3toSRGB(mesh.getColors());

        mesh.init();
        mesh.initRender();
        meshes.push(mesh);
      }

      if (this._autoMatrix)
        this.normalizeAndCenterMeshes(newMeshes);

      this._states.pushStateAdd(newMeshes);
      this.setMesh(meshes[meshes.length - 1]);
      this._camera.resetView();
      return newMeshes;
    },
    clearScene: function () {
      this.getStates().reset();
      this.getMeshes().length = 0;
      this.getCamera().resetView();
      this.setMesh(null);
      this._action = 'NOTHING';
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

      name = Picking.addAlpha(u8lum, img.width, img.height, name)._name;

      var entry = {};
      entry[name] = name;
      this.getGui().addAlphaOptions(entry);
      if (tool && tool._ctrlAlpha)
        tool._ctrlAlpha.setValue(name);
    }
  };

  module.exports = Scene;
});