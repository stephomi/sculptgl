define([], function () {

  'use strict';

  var TR = {
    // config
    configTitle: 'Config',

    // background
    backgroundTitle: 'バックグラウンド',
    backgroundReset: 'リセット',
    backgroundImport: 'インポート  (jpg, png...)',
    backgroundFill: 'Fill',

    // camera
    cameraTitle: 'カメラ',
    cameraReset: 'View',
    cameraCenter: 'Reset (bar)',
    cameraFront: 'Front (F)',
    cameraLeft: 'Left (L)',
    cameraTop: 'Top (T)',
    cameraMode: 'モード',
    cameraOrbit: 'Orbit (Turntable)',
    cameraSpherical: '球体 (Trackball)',
    cameraPlane: '平面 (Trackball)',
    cameraProjection: 'タイプ',
    cameraPerspective: '透視投影',
    cameraOrthographic: '平行投影',
    cameraFov: '視野',
    cameraPivot: 'ピボット選択',

    // file
    fileTitle: 'ファイル (インポート/エクスポート)',
    fileResetTitle: 'Scene',
    fileResetScene: 'Clear scene',
    fileResetSphere: 'Reset sphere',
    fileImportTitle: 'Import',
    fileAdd: 'Add (obj,ply,stl)',
    fileExportMeshTitle: 'Export Mesh',
    fileExportSceneTitle: 'Export Scene',
    fileExportOBJ: 'OBJ形式 (paint,quad,uv)',
    fileExportPLY: 'PLY形式 (color,quad)',
    fileExportSTL: 'STL形式 (tri)',

    // mesh
    meshTitle: 'メッシュ',
    meshNbVertices: 'Vertex : ',
    meshNbFaces: 'Faces : ',

    // topology
    topologyTitle: 'Topology',

    // multires
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
    sculptBrush: 'ブラシ (1)',
    sculptInflate: '膨張 (2)',
    sculptTwist: '回転 (3)',
    sculptSmooth: 'スムーズ化 (4)',
    sculptFlatten: 'フラット化 (5)',
    sculptPinch: 'つまむ (6)',
    sculptCrease: 'しわ (7)',
    sculptDrag: 'ドラッグ (8)',
    sculptPaint: 'ペイント (9)',
    sculptScale: 'スケール (0)',
    sculptTranslate: 'Translate',
    sculptRotate: 'Rotate',
    sculptTool: 'ツール',
    sculptSymmetry: '対称加工',
    sculptContinuous: '連続加工',
    sculptRadius: '半径',
    sculptIntensity: '明るさ',
    sculptCulling: 'Thin surface (front vertex only)',
    sculptNegative: 'ネガティブ (N)',
    sculptColor: 'Albedo',
    sculptRoughness: 'Roughness',
    sculptMetallic: 'Metallic',
    sculptClay: 'クレイ',
    sculptAccumulate: 'Accumulate (no limit per stroke)',
    sculptColorGlobal: 'Global',
    sculptPickColor: 'Picking Material',
    sculptTangentialSmoothing: 'Relax only',
    sculptDeleteMesh: 'Delete the mesh ?',

    // states
    stateTitle: '履歴',
    stateUndo: 'アンドゥ',
    stateRedo: 'リドゥ',
    stateMaxStack: 'Max Stack',

    // wacom
    wacomTitle: 'ワコムタブレット',
    wacomRadius: '圧力半径？',
    wacomIntensity: '圧力の強さ？',

    // sketchfab
    renderingTitle: 'Rendering',
    renderingGrid: 'Show grid',
    renderingMatcap: 'Matcap',
    renderingPBR: 'PBR',
    renderingTransparency: '透過',
    renderingNormal: 'ノーマル',
    renderingUV: 'UV shader',
    renderingShader: 'シェーダー',
    renderingMaterial: 'Material',
    renderingImportUV: 'Import (jpg, png...)',
    renderingExtra: 'Extra',
    renderingFlat: 'フラットシェーディング',
    renderingWireframe: 'ワイヤーフレーム',

    // matcaps
    matcapPearl: 'Pearl',
    matcapClay: 'クレイ',
    matcapSkin: 'スキン',
    matcapGreen: 'Green',
    matcapWhite: 'White',
    matcapBronze: 'ブロンス',
    matcapChavant: 'クレイ',
    matcapDrink: 'ドリンク',
    matcapRedVelvet: 'レッドベレット',
    matcapOrange: 'オレンジ',

    // sketchfab
    sketchfabTitle: 'Sketchfabへ移動',
    sketchfabUpload: 'アップロード',
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