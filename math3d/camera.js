'use strict';

function Camera()
{
  this.mode_ = Camera.mode.PLANE; //camera mode
  this.rot_ = quat.create(); //quaternion
  this.view_ = mat4.create(); //view matrix
  this.proj_ = mat4.create(); //projection matrix
  this.lastNormalizedMouseXY_ = [0, 0]; //last mouse position ( 0..1 )
  this.width_ = 0; //viewport width
  this.height_ = 0; //viewport height
  this.zoom_ = 20; //zoom value
  this.transX_ = 0; //translation in x
  this.transY_ = 0; //translation in y
  this.globalScale_ = 1; //solve scale issue
  this.moveX_ = 0; //free look (strafe)
  this.moveZ_ = 0; //free look (strafe)
}

//the camera modes
Camera.mode = {
  SPHERICAL: 0,
  PLANE: 1
};

Camera.prototype = {
  /** Set Camera mode */
  updateMode: function (mode)
  {
    this.mode_ = mode;
    this.rot_ = quat.create();
    var global = this.globalScale_;
    this.reset();
    this.globalScale_ = global;
    this.zoom(-0.4);
  },

  /** Start camera (store mouse coordinates) */
  start: function (mouseX, mouseY)
  {
    this.lastNormalizedMouseXY_ = Geometry.normalizedMouse(mouseX, mouseY, this.width_, this.height_);
  },

  /** Compute rotation values (by updating the quaternion) */
  rotate: function (mouseX, mouseY)
  {
    var normalizedMouseXY = Geometry.normalizedMouse(mouseX, mouseY, this.width_, this.height_);
    if (this.mode_ === Camera.mode.PLANE)
    {
      var length = vec2.dist(this.lastNormalizedMouseXY_, normalizedMouseXY);
      var diff = [0, 0];
      vec2.sub(diff, normalizedMouseXY, this.lastNormalizedMouseXY_);
      var axe = [-diff[1], diff[0], 0];
      vec3.normalize(axe, axe);
      quat.mul(this.rot_, quat.setAxisAngle([0, 0, 0, 0], axe, length * 2), this.rot_);
    }
    else if (this.mode_ === Camera.mode.SPHERICAL)
    {
      var mouseOnSphereBefore = Geometry.mouseOnUnitSphere(this.lastNormalizedMouseXY_);
      var mouseOnSphereAfter = Geometry.mouseOnUnitSphere(normalizedMouseXY);
      var angle = Math.acos(Math.min(1, vec3.dot(mouseOnSphereBefore, mouseOnSphereAfter)));
      var axeRot = [0, 0, 0];
      vec3.normalize(axeRot, vec3.cross(axeRot, mouseOnSphereBefore, mouseOnSphereAfter));
      quat.mul(this.rot_, quat.setAxisAngle([0, 0, 0, 0], axeRot, angle * 2), this.rot_);
    }
    this.lastNormalizedMouseXY_ = normalizedMouseXY;
  },

  /** Update model view matrices */
  updateView: function ()
  {
    var view = this.view_;
    var tx = this.transX_;
    var ty = this.transY_;
    mat4.lookAt(view, [tx, ty, this.zoom_], [tx, ty, 0], [0, 1, 0]);
    var matQuat = mat4.create();
    mat4.fromQuat(matQuat, this.rot_);
    mat4.mul(view, view, matQuat);
  },

  /** Update projection matrix */
  updateProjection: function ()
  {
    this.proj_ = mat4.create();
    mat4.perspective(this.proj_, 1.222, this.width_ / this.height_, 0.01, 100000);
  },

  /** Update translation */
  updateTranslation: function ()
  {
    this.transX_ += this.moveX_ * this.globalScale_ / 400.0;
    this.zoom_ = Math.max(0.00001, this.zoom_ + this.moveZ_ * this.globalScale_ / 400.0);
  },

  /** Compute translation values */
  translate: function (dx, dy)
  {
    this.transX_ -= dx * this.globalScale_;
    this.transY_ += dy * this.globalScale_;
  },

  /** Zoom */
  zoom: function (delta)
  {
    this.zoom_ = Math.max(0.00001, this.zoom_ - delta * this.globalScale_);
  },

  /** Reset camera */
  reset: function ()
  {
    this.rot_ = quat.create();
    this.zoom_ = 0;
    this.transX_ = 0.00001;
    this.transY_ = 0;
    this.globalScale_ = 1;
  }
};