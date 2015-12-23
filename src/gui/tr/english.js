define(function (require, exports, module) {

  'use strict';

  var TR = {
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
    fileImportTitle: 'Import',
    fileAdd: 'Add (obj, sgl, ply, stl)',
    fileAutoMatrix: 'Scale and center',
    fileVertexSRGB: 'sRGB vertex color',
    fileExportMeshTitle: 'Export Mesh',
    fileExportSceneTitle: 'Export Scene',
    fileExportSGL: 'Save .sgl (SculptGL)',
    fileExportOBJ: 'Save .obj',
    fileExportPLY: 'Save .ply',
    fileExportSTL: 'Save .stl',

    // scene
    sceneTitle: 'Scene',
    sceneReset: 'Clear scene',
    sceneAddSphere: 'Add sphere',
    sceneAddCube: 'Add cube',
    sceneAddCylinder: 'Add cylinder',
    sceneAddTorus: 'Add torus',
    sceneSelection: 'Selection',
    sceneMerge: 'Merge selection',

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
    remeshBlock: 'Block',

    // dynamic
    dynamicTitle: 'Dynamic Topology',
    dynamicActivated: 'Activated (no quads)',
    dynamicSubdivision: 'Subdivision',
    dynamicDecimation: 'Decimation',
    dynamicLinear: 'Linear subdivision',

    // sculpt
    sculptTitle: 'Sculpting & Painting',
    sculptBrush: 'Brush',
    sculptInflate: 'Inflate',
    sculptTwist: 'Twist',
    sculptSmooth: 'Smooth (-Shift)',
    sculptFlatten: 'Flatten',
    sculptPinch: 'Pinch',
    sculptCrease: 'Crease',
    sculptDrag: 'Drag',
    sculptPaint: 'Paint',
    sculptMasking: 'Masking (-Ctrl)',
    sculptMove: 'Move',
    sculptLocalScale: 'Local scale',
    sculptTransform: 'Transform (E)',

    sculptCommon: 'Common',
    sculptTool: 'Tool',
    sculptSymmetry: 'Symmetry',
    sculptContinuous: 'Continuous',
    sculptRadius: 'Radius (-X)',
    sculptIntensity: 'Intensity (-C)',
    sculptHardness: 'Hardness',
    sculptCulling: 'Thin surface (front vertex only)',
    sculptAlphaTitle: 'Alpha',
    sculptLockPositon: 'Lock position',
    sculptAlphaTex: 'Texture',
    sculptImportAlpha: 'Import alpha tex (jpg, png...)',
    sculptNegative: 'Negative (N or -Alt)',
    sculptColor: 'Albedo',
    sculptRoughness: 'Roughness',
    sculptMetallic: 'Metallic',
    sculptClay: 'Clay',
    sculptAccumulate: 'Accumulate (no limit per stroke)',
    sculptColorGlobal: 'Global',
    sculptPickColor: 'Material / Color picker (-S)',
    sculptTangentialSmoothing: 'Relax only',
    sculptTopologicalCheck: 'Topological check',
    sculptMoveAlongNormal: 'Move along normal (N or -Alt)',
    sculptMaskingClear: 'Clear (-Ctrl + Drag)',
    sculptMaskingInvert: 'Invert (-Ctrl + Click)',
    sculptMaskingBlur: 'Blur',
    sculptMaskingSharpen: 'Sharpen',
    sculptPBRTitle: 'PBR materials',
    sculptPaintAll: 'Paint all',
    sculptExtractTitle: 'Extract',
    sculptExtractThickness: 'Thickness',
    sculptExtractAction: 'Extract !',

    // states
    stateTitle: 'History',
    stateUndo: 'Undo',
    stateRedo: 'Redo',
    stateMaxStack: 'Max Stack',

    // wacom
    wacomTitle: 'Wacom tablet',
    wacomRadius: 'Pressure radius',
    wacomIntensity: 'Pressure intensity',

    // rendering
    renderingTitle: 'Rendering',
    renderingGrid: 'Show grid',
    renderingSymmetryLine: 'Show mirror line',
    renderingMatcap: 'Matcap',
    renderingCurvature: 'Curvature',
    renderingPBR: 'PBR',
    renderingTransparency: 'Transparency',
    renderingNormal: 'Normal shader',
    renderingUV: 'UV shader',
    renderingShader: 'Shader',
    renderingMaterial: 'Material',
    renderingImportUV: 'Import (jpg, png...)',
    renderingImportMatcap: 'Import (jpg, png...)',
    renderingExtra: 'Extra',
    renderingFlat: 'Flat shading',
    renderingWireframe: 'Wireframe (W)',
    renderingExposure: 'Exposure',
    renderingEnvironment: 'Environment',
    renderingIsolate: 'Isolate/Show (I)',
    renderingFilmic: 'Filmic tonemapping',

    // contour
    contour: 'Contour',
    contourShow: 'Show contour',
    contourColor: 'Color',
    darkenUnselected: 'Darken unselected',

    // pixel ratio
    resolution: 'Resolution',

    // matcaps
    matcapPearl: 'Pearl',
    matcapClay: 'Clay',
    matcapSkin: 'Skin',
    matcapGreen: 'Green',
    matcapWhite: 'White',

    // sketchfab
    sketchfabTitle: 'Go to Sketchfab !',
    sketchfabUpload: 'Upload',
    sketchfabUploadMessage: 'Please enter your sketchfab API Key.\n' +
      'You can also leave "guest" to upload anonymously.\n' +
      '(a new window will pop up when the uploading and processing is finished)',
    sketchfabUploadError: function (error) {
      return 'Sketchfab upload error :\n' + error;
    },
    sketchfabUploadSuccess: 'Upload success !\nHere is your link :',
    sketchfabAbort: 'Abort the last upload ?',
    sketchfabUploadProcessing: 'Processing...\nYour model will be available at :',

    about: 'About & Help',

    alphaNone: 'None',
    alphaSquare: 'Square',
    alphaSkin: 'Skin',

    envFootPrint: 'Foot Print',
    envGlazedPatio: 'Glazed Patio',
    envNicolausChurch: 'St Nicolaus church',
    envTerrace: 'Terrace',
    envBryantPark: 'BryantPark'
  };

  module.exports = TR;
});