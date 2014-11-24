define([
  'lib/glMatrix',
  'lib/yagui',
  'gui/GuiTR',
  'files/ReplayEnums',
  'math3d/Camera',
  'editor/Sculpt',
  'editor/Remesh',
  'render/Shader'
], function (glm, yagui, TR, Replay, Camera, Sculpt, Remesh, Shader) {

  'use strict';

  var vec3 = glm.vec3;
  var mat4 = glm.mat4;

  var ReplayReader = function (main) {
    this.main_ = main; // main application

    this.data_ = null; // typed array of input action
    this.sel_ = 0; // read selector
    this.cbReplayAction_ = this.replayAction.bind(this); // callback replay action
    this.event_ = {}; // dummy event
    this.event_.stopPropagation = this.event_.preventDefault = function () {};
    this.virtualCamera_ = null; // the virtual camera

    // extra control stuffs
    this.paused_ = false; // paused replay
    this.speed_ = 60; // speed replay

    // render
    this.virtualRender_ = []; // id mesh -> render config
    this.renderOverride_ = false; // override mesh render setting
    this.wireframe_ = false; // show wireframe
    this.flatShading_ = false; // flat shading
    this.shader_ = Shader.mode.PBR; // shader
    this.virtualGrid_ = true; // virtual grid
    this.grid_ = false; // grid

    // camera override
    this.realCamera_ = main.getCamera(); // the real camera
    this.cameraOverride_ = false; // use the virtual camera
    this.mouseX_ = 0; // real x mouse position
    this.mouseY = 0; // real y mouse position
    this.lastMouseX_ = 0; // real last x mouse position
    this.lastMouseY = 0; // real last y mouse position
    this.mouseButton_ = 0; // the real button pressed

    // progress is based on nbBytes load so it should ignore big ressources
    this.widgetProgress_ = null; // show progress
    this.nbBytesRessourcesLoaded_ = 0; // number of bytes loaded
    this.nbBytesRessourcesToLoad_ = 0; // total number of bytes to load
  };

  ReplayReader.prototype = {
    import: function (data) {
      var main = this.main_;
      this.data_ = new DataView(data);

      if (this.data_.getUint32(0) !== Replay.CODE)
        return;
      // TODO ... load other sculptgl version ?
      if (this.data_.getUint32(4) !== Replay.VERSION)
        return;
      this.nbBytesRessourcesToLoad_ = this.data_.getUint32(8);
      this.sel_ = 8 + 4;

      // basically it's a soft reset
      this.virtualCamera_ = new Camera();
      main.sculpt_ = new Sculpt(main.getStates());
      main.getPicking().rDisplay_ = 50;
      main.setReplayed(true);
      main.clearScene();
      main.replayer_.setFirstReplay(data);

      // to make sure all the undo/redo actions are executed
      main.getStates().setNewMaxStack(50);

      main.removeEvents();
      main.getGui().deleteGui();

      this.initEvents();

      this.initGui();
      this.main_.onCanvasResize();
      this.replayAction();
    },
    initGui: function () {
      if (this.guiReplay_)
        this.guiReplay_.setVisibility(true);
      this.guiReplay_ = new yagui.GuiMain(this.main_.getCanvas(), this.main_.onCanvasResize.bind(this.main_));
      var topbar = this.guiReplay_.addTopbar();
      var menu = topbar.addMenu(TR('replayTitle'));
      menu.addTitle(TR('cameraTitle'));
      menu.addCheckbox(TR('replayOverride'), this, 'cameraOverride_');

      menu.addTitle(TR('replaySpeed'));
      menu.addSlider(null, this, 'speed_', 1, 200, 1);
      menu.addCheckbox(TR('replayPaused'), this, 'paused_');

      menu.addTitle(TR('renderingTitle'));
      menu.addCheckbox(TR('replayOverride'), this.renderOverride_, this.onRenderOverrideChanged.bind(this));
      var optionsShaders = {};
      optionsShaders[Shader.mode.MATCAP] = TR('renderingMatcap');
      optionsShaders[Shader.mode.PBR] = TR('renderingPBR');
      menu.addCombobox(TR('renderingShader'), this.shader_, this.onShaderChanged.bind(this), optionsShaders);

      menu.addCheckbox(TR('renderingFlat'), this.flatShading_, this.onFlatShadingChanged.bind(this));
      menu.addCheckbox(TR('renderingWireframe'), this.wireframe_, this.onWireframeChanged.bind(this));
      menu.addCheckbox(TR('renderingGrid'), this.onGridChanged, this.onGridChanged.bind(this));

      this.widgetProgress_ = topbar.addMenu('Progress : ');
    },
    onShaderChanged: function (val) {
      this.shader_ = val;
      this.onRenderOverrideChanged();
    },
    onGridChanged: function (val) {
      this.grid_ = val;
      this.onRenderOverrideChanged();
    },
    onWireframeChanged: function (val) {
      this.wireframe_ = val;
      this.onRenderOverrideChanged();
    },
    onFlatShadingChanged: function (val) {
      this.flatShading_ = val;
      this.onRenderOverrideChanged();
    },
    onRenderOverrideChanged: function (val) {
      if (val !== undefined)
        this.renderOverride_ = val;
      this.applyRenderOverride();
      this.main_.applyRender();
    },
    initEvents: function () {
      var main = this.main_;
      this.canvas_ = main.getCanvas();
      this.loadFile = main.loadFile.bind(main);
      this.loadBackground = main.loadBackground.bind(main);
      this.removeEvents();
      this.addEvents();
    },
    removeEvents: function () {
      if (this.removeCallback) this.removeCallback();
    },
    addEvents: function () {
      this.main_.addEvents.call(this);
    },
    onContextLost: function () {},
    onContextRestored: function () {},
    onMouseOver: function () {},
    onMouseOut: function () {
      this.mouseButton_ = 0;
    },
    onMouseUp: function () {
      this.mouseButton_ = 0;
    },
    onMouseWheel: function (ev) {
      if (!this.cameraOverride_ && !this.paused_)
        return;
      var delta = Math.max(-1.0, Math.min(1.0, (ev.wheelDelta || -ev.detail)));
      this.realCamera_.zoom(delta * 0.02);
      this.main_.applyRender();
    },
    onTouchStart: function (ev) {
      this.main_.onTouchStart.call(this, ev);
    },
    onTouchMove: function (ev) {
      this.main_.onTouchMove.call(this, ev);
    },
    onMouseDown: function (ev) {
      this.main_.onMouseDown.call(this, ev);
    },
    onMouseMove: function (ev) {
      if (!this.cameraOverride_ && !this.paused_)
        return;
      this.main_.onMouseMove.call(this, ev);
      this.main_.applyRender();
    },
    onDeviceDown: function (ev) {
      this.main_.setMousePosition.call(this, ev);

      if (ev.ctrlKey)
        this.mouseButton_ = 4; // zoom camera
      else if (ev.altKey || event.which === 3)
        this.mouseButton_ = 2; // pan camera
      else {
        this.mouseButton_ = 3; // rotate camera
        this.realCamera_.start(this.mouseX_, this.mouseY_, this.main_.getPicking());
      }
    },
    onDeviceMove: function (ev) {
      this.main_.setMousePosition.call(this, ev);
      var mouseX = this.mouseX_;
      var mouseY = this.mouseY_;
      var button = this.mouseButton_;

      if (button === 2)
        this.realCamera_.translate((mouseX - this.lastMouseX_) / 3000, (mouseY - this.lastMouseY_) / 3000);
      else if (button === 4)
        this.realCamera_.zoom((mouseX - this.lastMouseX_) / 3000);
      else if (button === 3)
        this.realCamera_.rotate(mouseX, mouseY);

      this.lastMouseX_ = mouseX;
      this.lastMouseY_ = mouseY;
    },
    applyRenderOverride: function () {
      var override = this.renderOverride_;
      this.main_.showGrid_ = override ? this.grid_ : this.virtualGrid_;
      var meshes = this.main_.getMeshes();
      for (var i = 0, nbMeshes = meshes.length; i < nbMeshes; ++i) {
        var mesh = meshes[i];
        var ren = override ? this : this.getOrCreateRenderMesh(mesh);
        if (mesh.getShowWireframe() !== ren.wireframe_)
          mesh.setShowWireframe(ren.wireframe_);
        if (mesh.getFlatShading() !== ren.flatShading_)
          mesh.setFlatShading(ren.flatShading_);
        if (mesh.getShaderType() !== ren.shader_)
          mesh.setShader(ren.shader_);
      }
    },
    getOrCreateRenderMesh: function (mesh) {
      var rmid = this.virtualRender_[mesh.getID()];
      if (rmid)
        return rmid;
      rmid = this.virtualRender_[mesh.getID()] = {
        flatShading_: mesh.getFlatShading(),
        wireframe_: mesh.getShowWireframe(),
        shader_: mesh.getShaderType()
      };
      return rmid;
    },
    replayAction: function () {
      if (this.paused_) {
        window.setTimeout(this.cbReplayAction_, 100.0);
        return;
      }

      var ev = this.event_;
      var main = this.main_;
      var data = this.data_;
      var ac = data.getUint8(this.sel_++);
      var sel = this.sel_;

      // no render
      main.preventRender_ = true;
      // load virtual camera
      main.camera_ = this.virtualCamera_;
      var sculpt = main.sculpt_;
      var tool = main.sculpt_.getCurrentTool();

      switch (ac) {
      case Replay.DEVICE_MOVE:
        main.mouseX_ = data.getUint16(sel);
        main.mouseY_ = data.getUint16(sel + 2);
        main.onDeviceMove(ev);
        sel += 4;
        break;
      case Replay.DEVICE_DOWN:
        ev.which = data.getUint8(sel);
        main.mouseX_ = data.getUint16(sel + 1);
        main.mouseY_ = data.getUint16(sel + 3);
        main.onDeviceDown(ev);
        sel += 5;
        break;
      case Replay.DEVICE_UP:
        main.onMouseUp(ev);
        break;
      case Replay.DEVICE_WHEEL:
        ev.wheelDelta = data.getInt16(sel);
        main.onMouseWheel(ev);
        sel += 2;
        break;
      case Replay.UNDO:
        main.getGui().ctrlStates_.onUndo();
        break;
      case Replay.REDO:
        main.getGui().ctrlStates_.onRedo();
        break;
      case Replay.CAMERA_SIZE:
        this.virtualCamera_.width_ = data.getUint16(sel);
        this.virtualCamera_.height_ = data.getUint16(sel + 2);
        this.virtualCamera_.updateProjection();
        this.virtualCamera_.updateView();
        sel += 4;
        break;
      case Replay.CAMERA_FPS:
        this.virtualCamera_.moveX_ = data.getInt8(sel);
        this.virtualCamera_.moveZ_ = data.getInt8(sel + 1);
        this.virtualCamera_.updateTranslation();
        sel += 2;
        break;
      case Replay.CAMERA_MODE:
        this.virtualCamera_.setMode(data.getUint8(sel));
        sel += 1;
        break;
      case Replay.CAMERA_PROJ_TYPE:
        this.virtualCamera_.setProjType(data.getUint8(sel));
        sel += 1;
        break;
      case Replay.CAMERA_FOV:
        this.virtualCamera_.setFov(data.getUint8(sel));
        sel += 1;
        break;
      case Replay.CAMERA_RESET:
        this.virtualCamera_.resetView();
        break;
      case Replay.CAMERA_RESET_FRONT:
        this.virtualCamera_.resetViewFront();
        break;
      case Replay.CAMERA_RESET_LEFT:
        this.virtualCamera_.resetViewLeft();
        break;
      case Replay.CAMERA_RESET_TOP:
        this.virtualCamera_.resetViewTop();
        break;
      case Replay.CAMERA_TOGGLE_PIVOT:
        this.virtualCamera_.toggleUsePivot();
        break;
      case Replay.SCULPT_RADIUS:
        main.getPicking().rDisplay_ = data.getUint8(sel);
        sel += 1;
        break;
      case Replay.SCULPT_TOOL:
        sculpt.tool_ = data.getUint8(sel);
        sel += 1;
        break;
      case Replay.SCULPT_TOGGLE_SYMMETRY:
        sculpt.symmetry_ = !sculpt.symmetry_;
        break;
      case Replay.SCULPT_TOGGLE_CONTINUOUS:
        sculpt.continuous_ = !sculpt.continuous_;
        break;
      case Replay.SCULPT_UPDATE_CONTINOUS:
        tool.update(main);
        break;
      case Replay.BRUSH_INTENSITY:
      case Replay.CREASE_INTENSITY:
      case Replay.FLATTEN_INTENSITY:
      case Replay.INFLATE_INTENSITY:
      case Replay.SMOOTH_INTENSITY:
      case Replay.PINCH_INTENSITY:
      case Replay.PAINT_INTENSITY:
        tool.intensity_ = data.getUint8(sel) * 100;
        sel += 1;
        break;
      case Replay.BRUSH_TOGGLE_NEGATIVE:
      case Replay.CREASE_TOGGLE_NEGATIVE:
      case Replay.FLATTEN_TOGGLE_NEGATIVE:
      case Replay.PINCH_TOGGLE_NEGATIVE:
      case Replay.INFLATE_TOGGLE_NEGATIVE:
        tool.negative_ = !tool.negative_;
        break;
      case Replay.BRUSH_TOGGLE_CULLING:
      case Replay.CREASE_TOGGLE_CULLING:
      case Replay.FLATTEN_TOGGLE_CULLING:
      case Replay.INFLATE_TOGGLE_CULLING:
      case Replay.PINCH_TOGGLE_CULLING:
      case Replay.SMOOTH_TOGGLE_CULLING:
      case Replay.SCALE_TOGGLE_CULLING:
      case Replay.TWIST_TOGGLE_CULLING:
      case Replay.PAINT_TOGGLE_CULLING:
        tool.culling_ = !tool.culling_;
        break;
      case Replay.SMOOTH_TOGGLE_TANGENT:
        tool.tangent_ = !tool.tangent_;
        break;
      case Replay.BRUSH_TOGGLE_CLAY:
        tool.clay_ = !tool.clay_;
        break;
      case Replay.BRUSH_TOGGLE_ACCUMULATE:
        tool.accumulate_ = !tool.accumulate_;
        break;
      case Replay.PAINT_COLOR:
        vec3.set(tool.color_, data.getFloat32(sel), data.getFloat32(sel + 4), data.getFloat32(sel + 8));
        sel += 12;
        break;
      case Replay.PAINT_ROUGHNESS:
        tool.material_[0] = data.getFloat32(sel);
        sel += 4;
        break;
      case Replay.PAINT_METALLIC:
        tool.material_[1] = data.getFloat32(sel);
        sel += 4;
        break;
      case Replay.MULTI_RESOLUTION:
        main.getGui().ctrlTopology_.onResolutionChanged(data.getUint8(sel));
        sel += 1;
        break;
      case Replay.MULTI_SUBDIVIDE:
        main.getGui().ctrlTopology_.subdivide();
        break;
      case Replay.MULTI_REVERSE:
        main.getGui().ctrlTopology_.reverse();
        break;
      case Replay.MULTI_DEL_LOWER:
        main.getGui().ctrlTopology_.deleteLower();
        break;
      case Replay.MULTI_DEL_HIGHER:
        main.getGui().ctrlTopology_.deleteHigher();
        break;
      case Replay.VOXEL_REMESH:
        Remesh.resolution = data.getUint16(sel);
        main.getGui().ctrlTopology_.remesh();
        sel += 2;
        break;
      case Replay.DYNAMIC_TOGGLE_ACTIVATE:
        main.getGui().ctrlTopology_.dynamicToggleActivate();
        break;
      case Replay.DYNAMIC_TOGGLE_LINEAR:
        main.getGui().ctrlTopology_.dynamicToggleLinear();
        break;
      case Replay.DYNAMIC_SUBDIVISION:
        main.getGui().ctrlTopology_.dynamicSubdivision(data.getUint8(sel));
        sel += 1;
        break;
      case Replay.DYNAMIC_DECIMATION:
        main.getGui().ctrlTopology_.dynamicDecimation(data.getUint8(sel));
        sel += 1;
        break;
      case Replay.LOAD_MESHES:
        var nbBytes = data.getUint32(sel);
        main.loadScene(data.buffer.slice(sel + 4, sel + 4 + nbBytes), 'sgl');
        this.nbBytesRessourcesLoaded_ += nbBytes;
        sel += 4 + nbBytes;
        break;
      case Replay.ADD_SPHERE:
        main.addSphere();
        break;
      case Replay.CLEAR_SCENE:
        main.clearScene();
        break;
      case Replay.DELETE_CURRENT_MESH:
        main.deleteCurrentMesh();
        break;
      case Replay.EXPOSURE_INTENSITY:
        main.getGui().ctrlRendering_.onExposureChanged(data.getUint8(sel));
        sel += 1;
        break;
      case Replay.SHOW_GRID:
        main.getGui().ctrlRendering_.onShowGrid(data.getUint8(sel));
        this.virtualGrid_ = main.showGrid_;
        sel += 1;
        break;
      case Replay.SHOW_WIREFRAME:
        main.getGui().ctrlRendering_.onShowWireframe(data.getUint8(sel));
        this.getOrCreateRenderMesh(main.getMesh()).wireframe_ = main.getMesh().getShowWireframe();
        sel += 1;
        break;
      case Replay.FLAT_SHADING:
        main.getGui().ctrlRendering_.onFlatShading(data.getUint8(sel));
        this.getOrCreateRenderMesh(main.getMesh()).flatShading_ = main.getMesh().getFlatShading();
        sel += 1;
        break;
      case Replay.SHADER_SELECT:
        main.getGui().ctrlRendering_.onShaderChanged(data.getUint8(sel));
        this.getOrCreateRenderMesh(main.getMesh()).shader_ = main.getMesh().getShaderType();
        sel += 1;
        break;
      case Replay.MATCAP_SELECT:
        main.getGui().ctrlRendering_.onMatcapChanged(data.getUint8(sel));
        sel += 1;
        break;
      }
      if (this.renderOverride_)
        this.applyRenderOverride();

      // render
      // back virtual camera
      main.getCanvas().style.cursor = 'default';
      main.camera_ = this.realCamera_;
      if (!this.cameraOverride_)
        mat4.copy(this.realCamera_.view_, this.virtualCamera_.view_);
      main.applyRender();

      if (sel >= data.byteLength) {
        main.camera_ = this.virtualCamera_;
        this.removeEvents();
        main.addEvents();
        main.setReplayed(false);
        main.getGui().initGui();
        return;
      }
      this.sel_ = sel;
      var ratio = (sel - this.nbBytesRessourcesLoaded_) / (data.byteLength - this.nbBytesRessourcesToLoad_);
      this.widgetProgress_.domContainer.innerHTML = 'Progress : ' + parseInt(100 * ratio, 10) + '%';
      window.setTimeout(this.cbReplayAction_, 1000.0 / this.speed_);
    }
  };

  return ReplayReader;
});