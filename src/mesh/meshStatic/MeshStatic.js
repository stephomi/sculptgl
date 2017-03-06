import Mesh from 'mesh/Mesh';
import createTransformData from 'mesh/TransformData';
import createMeshData from 'mesh/MeshData';
import RenderData from 'mesh/RenderData';

class MeshStatic extends Mesh {

  constructor(gl) {
    super();

    this._id = Mesh.ID++; // useful id to retrieve a mesh (dynamic mesh, multires mesh, voxel mesh)

    if (gl) this._renderData = new RenderData(gl, this);
    this._meshData = createMeshData();
    this._transformData = createTransformData();
  }
}

export default MeshStatic;
