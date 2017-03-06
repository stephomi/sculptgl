import TR from 'gui/GuiTR';

class GuiMesh {

  constructor(guiParent, ctrlGui) {
    this._main = ctrlGui._main; // main application

    this.domVerts = null; // ctrl nb vertices
    this.domFaces = null; // ctrl nb faces
    this.domUl = null;
    this.init(guiParent);
  }

  init(guiParent) {
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

  updateMeshInfo() {
    var mesh = this._main.getMesh();
    this.domVerts.innerHTML = TR('meshNbVertices') + (mesh ? mesh.getNbVertices() : 0);
    this.domFaces.innerHTML = TR('meshNbFaces') + (mesh ? mesh.getNbFaces() : 0);
  }
}

export default GuiMesh;
