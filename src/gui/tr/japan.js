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
    fileImportTitle: 'Import',
    fileAdd: 'Add (obj, sgl, ply, stl)',
    fileExportMeshTitle: 'Export Mesh',
    fileExportSceneTitle: 'Export Scene',
    fileExportSGL: 'Save .sgl (SculptGL)',
    fileExportOBJ: 'Save .obj',
    fileExportPLY: 'Save .ply',
    fileExportSTL: 'Save .stl',
    fileReplayerTitle: 'Replayer (BETA)',
    fileReplayerImport: 'Load .rep',
    fileReplayerExport: 'Save .rep',

    // replayer
    replayTitle: 'Replay config',
    replayPaused: 'Paused',
    replaySpeed: 'Replay speed',
    replayOverride: 'Override',

    // scene
    sceneTitle: 'Scene',
    sceneReset: 'Clear scene',
    sceneAddSphere: 'Add sphere',

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
    remeshBlock: 'Block',

    // dynamic
    dynamicTitle: 'Dynamic Topology',
    dynamicActivated: 'Activated (no quads)',
    dynamicSubdivision: 'Subdivision',
    dynamicDecimation: 'Decimation',
    dynamicLinear: 'Linear subdivision',

    // sculpt
    sculptTitle: 'Sculpting & Painting',
    sculptBrush: 'ブラシ (1)',
    sculptInflate: '膨張 (2)',
    sculptTwist: '回転 (3)',
    sculptSmooth: 'スムーズ化 (4 or -Shift)',
    sculptFlatten: 'フラット化 (5)',
    sculptPinch: 'つまむ (6)',
    sculptCrease: 'しわ (7)',
    sculptDrag: 'ドラッグ (8)',
    sculptPaint: 'ペイント (9)',
    sculptMasking: 'Masking (-Ctrl)',
    sculptMove: 'Move (0)',
    sculptScale: 'スケール',
    sculptTranslate: 'Translate (E)',
    sculptRotate: 'Rotate (R)',
    sculptTool: 'ツール',
    sculptSymmetry: '対称加工',
    sculptContinuous: '連続加工',
    sculptRadius: '半径 (-X)',
    sculptIntensity: '明るさ (-C)',
    sculptHardness: 'Hardness',
    sculptCulling: 'Thin surface (front vertex only)',
    sculptAlphaTitle: 'Alpha',
    sculptLockPositon: 'Lock position',
    sculptAlphaTex: 'Texture',
    sculptImportAlpha: 'Import alpha tex (jpg, png...)',
    sculptNegative: 'ネガティブ (N or -Alt)',
    sculptColor: 'Albedo',
    sculptRoughness: 'Roughness',
    sculptMetallic: 'Metallic',
    sculptClay: 'クレイ',
    sculptAccumulate: 'Accumulate (no limit per stroke)',
    sculptColorGlobal: 'Global',
    sculptPickColor: 'Picking Material',
    sculptTangentialSmoothing: 'Relax only',
    sculptTopologicalCheck: 'Topological check',
    sculptMoveAlongNormal: 'Move along normal (N or -Alt)',
    sculptMaskingClear: 'Clear (-Ctrl + Drag)',
    sculptMaskingInvert: 'Invert (-Ctrl + Click)',
    sculptMaskingBlur: 'Blur',
    sculptMaskingSharpen: 'Sharpen',
    sculptDeleteMesh: 'Delete the mesh ?',
    sculptPBRTitle: 'PBR materials',
    sculptPaintAll: 'Paint all',

    // states
    stateTitle: '履歴',
    stateUndo: 'アンドゥ',
    stateRedo: 'リドゥ',
    stateMaxStack: 'Max Stack',

    // wacom
    wacomTitle: 'ワコムタブレット',
    wacomRadius: '圧力半径？',
    wacomIntensity: '圧力の強さ？',

    // rendering
    renderingTitle: 'Rendering',
    renderingGrid: 'Show grid',
    renderingSymmetryLine: 'Show Symmetry line',
    renderingMatcap: 'Matcap',
    renderingPBR: 'PBR',
    renderingTransparency: '透過',
    renderingNormal: 'ノーマル',
    renderingUV: 'UV shader',
    renderingShader: 'シェーダー',
    renderingMaterial: 'Material',
    renderingImportUV: 'Import (jpg, png...)',
    renderingExtra: 'Extra',
    renderingFlat: 'フラットシェーディング (slower)',
    renderingWireframe: 'ワイヤーフレーム (slower)',

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
    sketchfabUploadSuccess: 'Upload success !\nHere is your link :',
    sketchfabAbort: 'Abort the last upload ?',

    donate: 'Donate !'
  };

  return TR;
});