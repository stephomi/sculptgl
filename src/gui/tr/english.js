define([], function () {

  'use strict';

  var TR = {
    // config
    configTitle: 'Config',

    // background
    backgroundTitle: 'Background',
    backgroundReset: 'Reset',
    backgroundImport: 'Import (jpg, png...)',
    backgroundFill: 'Fill',

    // camera
    cameraTitle: 'Camera',
    cameraReset: 'View',
    cameraCenter: 'Reset (bar)',
    cameraFront: 'Front (F)',
    cameraLeft: 'Left (L)',
    cameraTop: 'Top (T)',
    cameraMode: 'Mode',
    cameraOrbit: 'Orbit (Turntable)',
    cameraSpherical: 'Spherical (Trackball)',
    cameraPlane: 'Plane (Trackball)',
    cameraProjection: 'Projection',
    cameraPerspective: 'Perspective',
    cameraOrthographic: 'Orthographic',
    cameraFov: 'Fov',
    cameraPivot: 'Picking pivot',

    // file
    fileTitle: 'Files (import/export)',
    fileResetTitle: 'Scene',
    fileResetScene: 'Clear scene',
    fileResetSphere: 'Reset sphere',
    fileImportTitle: 'Import',
    fileAdd: 'Add (obj, ply, stl)',
    fileExportMeshTitle: 'Export Mesh',
    fileExportSceneTitle: 'Export Scene',
    fileExportOBJ: 'OBJ (paint,quad,uv)',
    fileExportPLY: 'PLY (color,quad)',
    fileExportSTL: 'STL (tri)',

    // mesh
    meshTitle: 'Mesh',
    meshNbVertices: 'Vertex : ',
    meshNbFaces: 'Faces : ',

    // topology
    topologyTitle: 'Topology',

    //multires
    multiresTitle: 'Multiresolution',
    multiresSubdivide: 'Subdivide',
    multiresReverse: 'Reverse',
    multiresResolution: 'Resolution',
    multiresNoLower: 'There is no lower resolution level.',
    multiresNoHigher: 'There is no higher resolution level.',
    multiresDelHigher: 'Delete higher',
    multiresDelLower: 'Delete lower',
    multiresSelectLowest: 'Select the lowest resolution before reversing.',
    multiresSelectHighest: 'Select the highest resolution before subdividing.',
    multiresWarnBigMesh: function (nbFacesNext) {
      return 'The next subdivision level will reach ' + nbFacesNext + ' faces.\n' +
        'If you know what you are doing, click again on "subdivide".';
    },
    multiresNotReversible: 'Sorry it is not possile to reverse this mesh.\n' +
      'The mesh is not a product of a (loop-catmull) subdivision surface on a manifold mesh.',

    // remesh
    remeshTitle: 'Voxel Remeshing',
    remeshRemesh: 'Remesh',
    remeshResolution: 'Resolution',

    // sculpt
    sculptTitle: 'Sculpting & Painting',
    sculptBrush: 'Brush (1)',
    sculptInflate: 'Inflate (2)',
    sculptTwist: 'Twist (3)',
    sculptSmooth: 'Smooth (4)',
    sculptFlatten: 'Flatten (5)',
    sculptPinch: 'Pinch (6)',
    sculptCrease: 'Crease (7)',
    sculptDrag: 'Drag (8)',
    sculptPaint: 'Paint (9)',
    sculptScale: 'Scale (0)',
    sculptTranslate: 'Translate',
    sculptRotate: 'Rotate',
    sculptTool: 'Tool',
    sculptSymmetry: 'Symmetry',
    sculptContinuous: 'Continuous',
    sculptRadius: 'Radius',
    sculptIntensity: 'Intensity',
    sculptCulling: 'Thin surface (front vertex only)',
    sculptNegative: 'Negative (N)',
    sculptColor: 'Albedo',
    sculptRoughness: 'Roughness',
    sculptMetallic: 'Metallic',
    sculptClay: 'Clay',
    sculptAccumulate: 'Accumulate (no limit per stroke)',
    sculptColorGlobal: 'Global',
    sculptPickColor: 'Picking Material',
    sculptTangentialSmoothing: 'Relax only',
    sculptDeleteMesh: 'Delete the mesh ?',

    // states
    stateTitle: 'History',
    stateUndo: 'Undo',
    stateRedo: 'Redo',
    stateMaxStack: 'Max Stack',

    // wacom
    wacomTitle: 'Wacom tablet',
    wacomRadius: 'Pressure radius',
    wacomIntensity: 'Pressure intensity',

    // sketchfab
    renderingTitle: 'Rendering',
    renderingGrid: 'Show grid',
    renderingMatcap: 'Matcap',
    renderingPBR: 'PBR',
    renderingTransparency: 'Transparency',
    renderingNormal: 'Normal shader',
    renderingUV: 'UV shader',
    renderingShader: 'Shader',
    renderingMaterial: 'Material',
    renderingImportUV: 'Import (jpg, png...)',
    renderingExtra: 'Extra',
    renderingFlat: 'flat (slower)',
    renderingWireframe: 'wireframe',

    // matcaps
    matcapPearl: 'Pearl',
    matcapClay: 'Clay',
    matcapSkin: 'Skin',
    matcapGreen: 'Green',
    matcapWhite: 'White',
    matcapBronze: 'Bronze',
    matcapChavant: 'Chavant',
    matcapDrink: 'Drink',
    matcapRedVelvet: 'Red Velvet',
    matcapOrange: 'Orange',

    // sketchfab
    sketchfabTitle: 'Go to Sketchfab !',
    sketchfabUpload: 'Upload',
    sketchfabUploadMessage: 'Please enter your sketchfab API Key.\n' +
      'You can also leave "guest" to upload anonymously.\n' +
      '(a new window will pop up when the uploading and processing is finished)',
    sketchfabUploadError: function (error) {
      return 'Sketchfab upload error :\n' + error;
    },
    sketchfabUploadSuccess: 'Upload success !\nHere"s your link :'
  };

  return TR;
});