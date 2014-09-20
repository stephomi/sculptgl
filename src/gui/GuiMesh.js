define([
  'gui/GuiTR'
], function (TR) {

  'use strict';

  function GuiMesh(guiParent, ctrlGui) {
    this.main_ = ctrlGui.main_; // main application

    this.domVerts = document.createElement('ul');
    this.domVerts.innerHTML = TR('meshNbVertices');

    this.domFaces = document.createElement('ul');
    this.domFaces.innerHTML = TR('meshNbFaces');

    this.domUl = document.createElement('span');
    this.domUl.appendChild(this.domVerts);
    this.domUl.appendChild(this.domFaces);
    var style = this.domUl.style;
    style.cursor = 'default';
    if (style.float === undefined) style.cssFloat = 'right';
    else style.float = 'right';

    guiParent.domTopbar.appendChild(this.domUl);
  }

  GuiMesh.prototype = {
    /** Update number of vertices and faces */
    updateMeshInfo: function () {
      var mesh = this.main_.getMesh();
      this.domVerts.innerHTML = TR('meshNbVertices') + (mesh ? mesh.getNbVertices() : 0);
      this.domFaces.innerHTML = TR('meshNbFaces') + (mesh ? mesh.getNbFaces() : 0);
    }
  };

  return GuiMesh;
});