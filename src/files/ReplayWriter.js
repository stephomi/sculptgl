define([
  'lib/glMatrix',
  'lib/FileSaver',
  'editor/Sculpt',
  'files/ExportSGL',
  'files/ReplayEnums',
  'gui/GuiTR',
  'misc/Tablet'
], function (glm, saveAs, Sculpt, ExportSGL, Replay, TR, Tablet) {

  'use strict';

  var vec3 = glm.vec3;

  var ReplayWriter = function (main) {
    this.main_ = main; // main application
    this.noUpload_ = true; // prevent automatic upload

    this.firstReplay_ = null; // first part of the replaying (if we are importing a replayer)
    this.nbBytesLoadingMeshes_ = 0; // nb bytes of loaded meshes

    // (for now we don't serialize 64b data so 32b for each stack action
    // is enough for an upper estimation when exporting the replay file)
    this.stack_ = []; // stack of input action

    this.lastRadius_ = 50.0; // last radius
    this.sculpt_ = new Sculpt(); // states of sculpting tools
    this.pressureOnRadius_ = true; // pressure on radius
    this.pressureOnIntensity_ = false; // pressure on intensity
    this.pressure_ = 1.0; // tablet pressure

    this.autoUpload_ = true; // send file if it's not too big :D
    this.lastNbActions_ = 0; // nb of last checked stack action
    this.uid_ = new Date().getTime(); // best uid ever
    this.cbCheckUpload_ = window.setTimeout.bind(window, this.checkUpload.bind(this), 10000);
    this.checkUpload();
  };

  ReplayWriter.prototype = {
    pushAction: function (str) {
      this.stack_.push(Replay[str]);
      for (var i = 1, nbArgs = arguments.length; i < nbArgs; ++i)
        this.stack_.push(arguments[i]);
    },
    checkUpload: function (statusWidget) {
      var nbActions = this.stack_.length;
      if (!statusWidget) {
        if (this.noUpload_ || nbActions === this.lastNbActions_ || nbActions < 5000)
          return;
      }
      // 10 Mb limits of loaded meshes (or with previous replay)
      if (this.nbBytesLoadingMeshes_ > 10e6 || (this.firstReplay_ && this.firstReplay_.byteLength > 10e6))
        return statusWidget ? undefined : this.cbCheckUpload_();
      this.lastNbActions_ = nbActions;

      var uid = this.uid_;
      parent.location.hash = uid;

      var fd = new FormData();
      fd.append('filename', uid + '.rep');
      fd.append('file', this.export());

      var xhr = new XMLHttpRequest();
      xhr.open('POST', 'http://stephaneginier.com/replays/replayUpload.php', true);
      if (statusWidget) {
        var hideStatus = function () {
          if (!statusWidget.sketchfab)
            statusWidget.setVisibility(false);
          statusWidget.replay = false;
        };
        xhr.onload = function () {
          hideStatus();
          window.prompt(TR('fileReplayerSuccess'), 'http://stephaneginier.com/sculptgl?replay=' + uid);
        };
        xhr.onprogress = function (event) {
          if (event.lengthComputable)
            statusWidget.domContainer.innerHTML = 'Uploading : ' + Math.round(event.loaded * 100.0 / event.total) + '%';
        };
        xhr.onerror = hideStatus;
        xhr.onabort = hideStatus;
      } else {
        xhr.onload = this.cbCheckUpload_;
      }
      xhr.send(fd);
      return xhr;
    },
    reset: function () {
      this.uid_ = new Date().getTime();
      parent.location.hash = '';
      this.lastDeviceMove_ = undefined;
      this.lastExposure_ = undefined;
      this.lastTransparency_ = undefined;
      this.lastFov_ = undefined;
      this.lastNbActions_ = 0;
      this.lastRadius_ = 50.0;

      this.pressure_ = 1.0;
      this.tUseOnRadius_ = true;
      this.tUseOnIntensity_ = false;
      this.firstReplay_ = null;
      this.nbBytesLoadingMeshes_ = 0;
      this.stack_.length = 0;
      this.sculpt_ = new Sculpt();

      var cam = this.main_.getCamera();
      this.pushAction('CAMERA_SIZE', cam.width_, cam.height_);
      this.pushAction('CAMERA_MODE', cam.getMode());
      this.pushAction('CAMERA_PROJ_TYPE', cam.getProjType());
      this.pushCameraFov(cam.getFov());
      if (cam.getUsePivot()) this.pushAction('CAMERA_TOGGLE_PIVOT');
    },
    setFirstReplay: function (buffer) {
      this.stack_.length = 0;
      this.firstReplay_ = buffer;
    },
    checkCommonSculptAttributes: function (mainSel, replaySel, name) {
      if (mainSel.intensity_ !== undefined && mainSel.intensity_ !== replaySel.intensity_) {
        replaySel.intensity_ = mainSel.intensity_;
        this.stack_.push(Replay[name + '_INTENSITY'], mainSel.intensity_ * 100);
      }
      if (mainSel.hardness_ !== undefined && mainSel.hardness_ !== replaySel.hardness_) {
        replaySel.hardness_ = mainSel.hardness_;
        this.stack_.push(Replay[name + '_HARDNESS'], mainSel.hardness_ * 100);
      }
      if (mainSel.negative_ !== undefined && mainSel.negative_ !== replaySel.negative_) {
        replaySel.negative_ = mainSel.negative_;
        this.stack_.push(Replay[name + '_TOGGLE_NEGATIVE']);
      }
      if (mainSel.culling_ !== undefined && mainSel.culling_ !== replaySel.culling_) {
        replaySel.culling_ = mainSel.culling_;
        this.stack_.push(Replay[name + '_TOGGLE_CULLING']);
      }
      if (mainSel.lockPosition_ !== undefined && mainSel.lockPosition_ !== replaySel.lockPosition_) {
        replaySel.lockPosition_ = mainSel.lockPosition_;
        this.stack_.push(Replay[name + '_TOGGLE_LOCK_POSITION']);
      }
      if (mainSel.idAlpha_ !== undefined && mainSel.idAlpha_ !== replaySel.idAlpha_) {
        replaySel.idAlpha_ = mainSel.idAlpha_;
        this.stack_.push(Replay[name + '_SELECT_ALPHA'], mainSel.idAlpha_);
      }
    },
    checkSculptTools: function () {
      if (Tablet.useOnRadius !== this.pressureOnRadius_) {
        this.pressureOnRadius_ = Tablet.useOnRadius;
        this.stack_.push(Replay.TABLET_TOGGLE_RADIUS);
      }
      if (Tablet.useOnIntensity !== this.pressureOnIntensity_) {
        this.pressureOnIntensity_ = Tablet.useOnIntensity;
        this.stack_.push(Replay.TABLET_TOGGLE_INTENSITY);
      }
      var pre = Tablet.pressure();
      if (pre !== this.pressure_) {
        this.pressure_ = pre;
        this.stack_.push(Replay.TABLET_PRESSURE, pre);
      }

      var radius = this.main_.getPicking().getScreenRadius();
      if (radius !== this.lastRadius_) {
        this.lastRadius_ = radius;
        this.stack_.push(Replay.SCULPT_RADIUS, radius);
      }

      var mainSc = this.main_.getSculpt();
      var replaySc = this.sculpt_;

      if (mainSc.symmetry_ !== replaySc.symmetry_) {
        replaySc.symmetry_ = mainSc.symmetry_;
        this.stack_.push(Replay.SCULPT_TOGGLE_SYMMETRY);
      }
      if (mainSc.continuous_ !== replaySc.continuous_) {
        replaySc.continuous_ = mainSc.continuous_;
        this.stack_.push(Replay.SCULPT_TOGGLE_CONTINUOUS);
      }

      var tool = mainSc.tool_;
      var mainSel = mainSc.getCurrentTool();

      if (replaySc.tool_ !== tool) {
        replaySc.tool_ = tool;
        this.stack_.push(Replay.SCULPT_TOOL, tool);
      }
      var replaySel = replaySc.getCurrentTool();

      switch (tool) {
      case Sculpt.tool.BRUSH:
        this.checkCommonSculptAttributes(mainSel, replaySel, 'BRUSH');
        if (mainSel.clay_ !== replaySel.clay_) {
          replaySel.clay_ = mainSel.clay_;
          this.stack_.push(Replay.BRUSH_TOGGLE_CLAY);
        }
        if (mainSel.accumulate_ !== replaySel.accumulate_) {
          replaySel.accumulate_ = mainSel.accumulate_;
          this.stack_.push(Replay.BRUSH_TOGGLE_ACCUMULATE);
        }
        break;
      case Sculpt.tool.CREASE:
        this.checkCommonSculptAttributes(mainSel, replaySel, 'CREASE');
        break;
      case Sculpt.tool.INFLATE:
        this.checkCommonSculptAttributes(mainSel, replaySel, 'INFLATE');
        break;
      case Sculpt.tool.FLATTEN:
        this.checkCommonSculptAttributes(mainSel, replaySel, 'FLATTEN');
        break;
      case Sculpt.tool.PINCH:
        this.checkCommonSculptAttributes(mainSel, replaySel, 'PINCH');
        break;
      case Sculpt.tool.SMOOTH:
        this.checkCommonSculptAttributes(mainSel, replaySel, 'SMOOTH');
        if (mainSel.tangent_ !== replaySel.tangent_) {
          replaySel.tangent_ = mainSel.tangent_;
          this.stack_.push(Replay.SMOOTH_TOGGLE_TANGENT);
        }
        break;
      case Sculpt.tool.MOVE:
        if (mainSel.topoCheck_ !== replaySel.topoCheck_) {
          replaySel.topoCheck_ = mainSel.topoCheck_;
          this.stack_.push(Replay.MOVE_TOGGLE_TOPOCHECK);
        }
        break;
      case Sculpt.tool.MASKING:
        this.checkCommonSculptAttributes(mainSel, replaySel, 'MASKING');
        break;
      case Sculpt.tool.TWIST:
        this.checkCommonSculptAttributes(mainSel, replaySel, 'TWIST');
        break;
      case Sculpt.tool.DRAG:
        this.checkCommonSculptAttributes(mainSel, replaySel, 'DRAG');
        break;
      case Sculpt.tool.TRANSLATE:
        this.checkCommonSculptAttributes(mainSel, replaySel, 'TRANSLATE');
        break;
      case Sculpt.tool.ROTATE:
        this.checkCommonSculptAttributes(mainSel, replaySel, 'ROTATE');
        break;
      case Sculpt.tool.LOCALSCALE:
        this.checkCommonSculptAttributes(mainSel, replaySel, 'LOCALSCALE');
        break;
      case Sculpt.tool.PAINT:
        // optimize a bit
        if (mainSel.pickColor_)
          break;
        this.checkCommonSculptAttributes(mainSel, replaySel, 'PAINT');
        if (mainSel.material_[0] !== replaySel.material_[0]) {
          replaySel.material_[0] = mainSel.material_[0];
          this.stack_.push(Replay.PAINT_ROUGHNESS, mainSel.material_[0]);
        }
        if (mainSel.material_[1] !== replaySel.material_[1]) {
          replaySel.material_[1] = mainSel.material_[1];
          this.stack_.push(Replay.PAINT_METALLIC, mainSel.material_[1]);
        }
        if (vec3.sqrDist(mainSel.color_, replaySel.color_) !== 0.0) {
          vec3.copy(replaySel.color_, mainSel.color_);
          this.stack_.push(Replay.PAINT_COLOR, mainSel.color_[0], mainSel.color_[1], mainSel.color_[2]);
        }
        break;
      }
    },
    pushDeviceDown: function (button, x, y, event) {
      this.checkSculptTools();
      var mask = 0;
      if (event.ctrlKey) mask |= Replay.CTRL;
      if (event.altKey) mask |= Replay.ALT;
      this.stack_.push(Replay.DEVICE_DOWN, button, x, y, mask);
    },
    pushDeviceUp: function () {
      this.checkSculptTools();
      this.stack_.push(Replay.DEVICE_UP);
    },
    pushDeviceMove: function (x, y, event) {
      var mask = 0;
      if (event.ctrlKey) mask |= Replay.CTRL;
      if (event.altKey) mask |= Replay.ALT;
      if (event.shiftKey) mask |= Replay.SHIFT;
      // optimize a bit
      if (this.main_.mouseButton_ === 0) {
        if (this.lastDeviceMove_ === this.stack_.length - 4) {
          this.stack_[this.stack_.length - 3] = x;
          this.stack_[this.stack_.length - 2] = y;
          this.stack_[this.stack_.length - 1] = mask;
          return;
        }
      }
      this.lastDeviceMove_ = this.stack_.length;
      this.checkSculptTools();
      this.stack_.push(Replay.DEVICE_MOVE, x, y, mask);
    },
    pushLoadAlpha: function (u8, w, h) {
      this.nbBytesLoadingMeshes_ += u8.byteLength;
      this.stack_.push(Replay.LOAD_ALPHA, w, h, u8);
    },
    pushLoadMeshes: function (meshes, fdata, type) {
      var ab = type === 'sgl' ? fdata.slice() : ExportSGL.exportSGLAsArrayBuffer(meshes);
      this.nbBytesLoadingMeshes_ += ab.byteLength;
      this.stack_.push(Replay.LOAD_MESHES, ab);
    },
    pushCameraFov: function (val) {
      this.pushOptimize('lastFov_', Replay.CAMERA_FOV, val);
    },
    pushExposure: function (val) {
      this.pushOptimize('lastExposure_', Replay.EXPOSURE_INTENSITY, val);
    },
    pushTransparency: function (val) {
      this.pushOptimize('lastTransparency_', Replay.SET_TRANSPARENCY, val);
    },
    pushOptimize: function (comp, key, val) {
      if (this[comp] === this.stack_.length - 2) {
        this.stack_[this.stack_.length - 1] = val;
        return;
      }
      this[comp] = this.stack_.length;
      this.stack_.push(key, val);
    },
    export: function () {
      var stack = this.stack_;
      var nb = stack.length;

      var offset = this.firstReplay_ ? this.firstReplay_.byteLength : 0;
      var buffer = new ArrayBuffer(this.nbBytesLoadingMeshes_ + offset + (nb + 2) * 4);

      var data = new DataView(buffer);
      var u8a = new Uint8Array(buffer);

      if (this.firstReplay_)
        u8a.set(new Uint8Array(this.firstReplay_));
      else {
        data.setUint32(0, Replay.CODE, true);
        data.setUint32(4, Replay.VERSION, true);
        offset += 8 + 4; // code(4o) + version(4o) + nbytes (4o)
      }
      data.setUint32(8, data.getUint32(8, true) + this.nbBytesLoadingMeshes_, true);

      for (var i = 0; i < nb; ++i) {
        var ac = stack[i];
        data.setUint8(offset++, ac, true);
        switch (ac) {
        case Replay.DEVICE_MOVE:
          data.setUint16(offset, stack[++i], true);
          data.setUint16(offset + 2, stack[++i], true);
          data.setUint8(offset + 4, stack[++i], true);
          offset += 5;
          break;
        case Replay.DEVICE_DOWN:
          data.setUint8(offset, stack[++i], true);
          data.setUint16(offset + 1, stack[++i], true);
          data.setUint16(offset + 3, stack[++i], true);
          data.setUint8(offset + 5, stack[++i], true);
          offset += 6;
          break;
        case Replay.DEVICE_WHEEL:
          data.setInt8(offset, stack[++i], true);
          offset += 1;
          break;
        case Replay.CAMERA_SIZE:
          data.setUint16(offset, stack[++i], true);
          data.setUint16(offset + 2, stack[++i], true);
          offset += 4;
          break;
        case Replay.CAMERA_FPS:
          data.setInt8(offset, stack[++i], true);
          data.setInt8(offset + 1, stack[++i], true);
          offset += 2;
          break;
        case Replay.CAMERA_MODE:
        case Replay.CAMERA_PROJ_TYPE:
        case Replay.CAMERA_FOV:
        case Replay.SCULPT_TOOL:
        case Replay.SCULPT_RADIUS:
        case Replay.BRUSH_INTENSITY:
        case Replay.CREASE_INTENSITY:
        case Replay.FLATTEN_INTENSITY:
        case Replay.INFLATE_INTENSITY:
        case Replay.PINCH_INTENSITY:
        case Replay.SMOOTH_INTENSITY:
        case Replay.PAINT_INTENSITY:
        case Replay.MOVE_INTENSITY:
        case Replay.MASKING_INTENSITY:
        case Replay.PAINT_HARDNESS:
        case Replay.MASKING_HARDNESS:
        case Replay.MULTI_RESOLUTION:
        case Replay.DYNAMIC_SUBDIVISION:
        case Replay.DYNAMIC_DECIMATION:
        case Replay.EXPOSURE_INTENSITY:
        case Replay.SET_TRANSPARENCY:
        case Replay.SHOW_GRID:
        case Replay.SHOW_WIREFRAME:
        case Replay.FLAT_SHADING:
        case Replay.SHADER_SELECT:
        case Replay.MATCAP_SELECT:
        case Replay.BRUSH_SELECT_ALPHA:
        case Replay.CREASE_SELECT_ALPHA:
        case Replay.FLATTEN_SELECT_ALPHA:
        case Replay.INFLATE_SELECT_ALPHA:
        case Replay.PINCH_SELECT_ALPHA:
        case Replay.SMOOTH_SELECT_ALPHA:
        case Replay.LOCALSCALE_SELECT_ALPHA:
        case Replay.TWIST_SELECT_ALPHA:
        case Replay.DRAG_SELECT_ALPHA:
        case Replay.PAINT_SELECT_ALPHA:
        case Replay.MASKING_SELECT_ALPHA:
        case Replay.MOVE_SELECT_ALPHA:
          data.setUint8(offset, stack[++i], true);
          offset += 1;
          break;
        case Replay.PAINT_COLOR:
          data.setFloat32(offset, stack[++i], true);
          data.setFloat32(offset + 4, stack[++i], true);
          data.setFloat32(offset + 8, stack[++i], true);
          offset += 12;
          break;
        case Replay.PAINT_ROUGHNESS:
        case Replay.PAINT_METALLIC:
        case Replay.TABLET_PRESSURE:
        case Replay.MASKING_EXTRACT:
          data.setFloat32(offset, stack[++i], true);
          offset += 4;
          break;
        case Replay.VOXEL_REMESH:
          data.setUint16(offset, stack[++i], true);
          data.setUint8(offset + 2, stack[++i], true);
          offset += 3;
          break;
        case Replay.LOAD_ALPHA:
          data.setUint32(offset, stack[++i], true);
          data.setUint32(offset + 4, stack[++i], true);
          var abA = stack[++i];
          data.setUint32(offset + 8, abA.byteLength, true);
          u8a.set(abA, offset + 12);
          offset += 12 + abA.byteLength;
          break;
        case Replay.LOAD_MESHES:
          var ab = stack[++i];
          data.setUint32(offset, ab.byteLength, true);
          u8a.set(new Uint8Array(ab), offset + 4);
          offset += 4 + ab.byteLength;
          break;
        }
      }

      data = new DataView(buffer, 0, offset);
      return new Blob([data]);
    }
  };

  return ReplayWriter;
});