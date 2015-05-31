define([], function () {

  'use strict';

  var TR = {
    // config
    configTitle: null,

    // background
    backgroundTitle: 'バックグラウンド',
    backgroundReset: 'リセット',
    backgroundImport: 'インポート  (jpg, png...)',
    backgroundFill: null,

    // camera
    cameraTitle: 'カメラ',
    cameraReset: 'View',
    cameraCenter: null,
    cameraFront: null,
    cameraLeft: null,
    cameraTop: null,
    cameraMode: 'モード',
    cameraOrbit: null,
    cameraSpherical: '球体 (Trackball)',
    cameraPlane: '平面 (Trackball)',
    cameraProjection: 'タイプ',
    cameraPerspective: '透視投影',
    cameraOrthographic: '平行投影',
    cameraFov: '視野',
    cameraPivot: 'ピボット選択',

    // file
    fileTitle: 'ファイル (インポート/エクスポート)',
    fileImportTitle: null,
    fileAdd: 'Add (obj, sgl, ply, stl)',
    fileAutoMatrix: null,
    fileExportMeshTitle: null,
    fileExportSceneTitle: null,
    fileExportSGL: null,
    fileExportOBJ: null,
    fileExportPLY: null,
    fileExportSTL: null,

    // scene
    sceneTitle: null,
    sceneReset: null,
    sceneAddSphere: null,
    sceneAddCube: null,
    sceneSelection: null,
    sceneMerge: null,

    // mesh
    meshTitle: 'メッシュ',
    meshNbVertices: null,
    meshNbFaces: null,

    // topology
    topologyTitle: null,

    // multires
    multiresTitle: null,
    multiresSubdivide: null,
    multiresReverse: null,
    multiresResolution: null,
    multiresNoLower: null,
    multiresNoHigher: null,
    multiresDelHigher: null,
    multiresDelLower: null,
    multiresSelectLowest: null,
    multiresSelectHighest: null,
    multiresWarnBigMesh: null,
    // 
    // 

    multiresNotReversible: null,
    // 

    // remesh
    remeshTitle: null,
    remeshRemesh: null,
    remeshResolution: null,
    remeshBlock: null,

    // dynamic
    dynamicTitle: null,
    dynamicActivated: null,
    dynamicSubdivision: null,
    dynamicDecimation: null,
    dynamicLinear: null,

    // sculpt
    sculptTitle: null,
    sculptBrush: 'ブラシ (1)',
    sculptInflate: '膨張 (2)',
    sculptTwist: '回転 (3)',
    sculptSmooth: 'スムーズ化 (4 or -Shift)',
    sculptFlatten: 'フラット化 (5)',
    sculptPinch: 'つまむ (6)',
    sculptCrease: 'しわ (7)',
    sculptDrag: 'ドラッグ (8)',
    sculptPaint: 'ペイント (9)',
    sculptMasking: null,
    sculptMove: null,
    sculptLocalScale: null,
    sculptScale: 'スケール (G)',
    sculptTranslate: null,
    sculptRotate: null,
    sculptTool: 'ツール',
    sculptSymmetry: '対称加工',
    sculptContinuous: '連続加工',
    sculptRadius: '半径 (-X)',
    sculptIntensity: '明るさ (-C)',
    sculptHardness: null,
    sculptCulling: null,
    sculptAlphaTitle: null,
    sculptLockPositon: null,
    sculptAlphaTex: null,
    sculptImportAlpha: null,
    sculptNegative: 'ネガティブ (N or -Alt)',
    sculptColor: null,
    sculptRoughness: null,
    sculptMetallic: null,
    sculptClay: 'クレイ',
    sculptAccumulate: null,
    sculptColorGlobal: null,
    sculptPickColor: null,
    sculptTangentialSmoothing: null,
    sculptTopologicalCheck: null,
    sculptMoveAlongNormal: null,
    sculptMaskingClear: null,
    sculptMaskingInvert: null,
    sculptMaskingBlur: null,
    sculptMaskingSharpen: null,
    sculptDeleteSelection: null,
    sculptPBRTitle: null,
    sculptPaintAll: null,
    sculptTranslateDepth: null,
    sculptRotateRoll: null,
    sculptExtractTitle: null,
    sculptExtractThickness: null,
    sculptExtractAction: null,

    // states
    stateTitle: '履歴',
    stateUndo: 'アンドゥ',
    stateRedo: 'リドゥ',
    stateMaxStack: null,

    // wacom
    wacomTitle: 'ワコムタブレット',
    wacomRadius: '圧力半径？',
    wacomIntensity: '圧力の強さ？',

    // rendering
    renderingTitle: null,
    renderingGrid: null,
    renderingSymmetryLine: null,
    renderingMatcap: null,
    renderingCurvature: null,
    renderingPBR: null,
    renderingTransparency: '透過',
    renderingNormal: 'ノーマル',
    renderingUV: null,
    renderingShader: 'シェーダー',
    renderingMaterial: null,
    renderingImportUV: null,
    renderingExtra: null,
    renderingFlat: 'フラットシェーディング (slower)',
    renderingWireframe: 'ワイヤーフレーム (slower)',
    renderingExposure: null,
    renderingEnvironment: null,
    renderingIsolate: null,

    // contour
    contour: null,
    contourShow: null,
    contourColor: null,

    // matcaps
    matcapPearl: null,
    matcapClay: 'クレイ',
    matcapSkin: 'スキン',
    matcapGreen: null,
    matcapWhite: null,
    matcapBronze: 'ブロンス',
    matcapChavant: 'クレイ',
    matcapDrink: 'ドリンク',
    matcapRedVelvet: 'レッドベレット',
    matcapOrange: 'オレンジ',

    // sketchfab
    sketchfabTitle: 'Sketchfabへ移動',
    sketchfabUpload: 'アップロード',
    sketchfabUploadMessage: null,
    // 

    sketchfabUploadError: null,
    // 

    sketchfabUploadSuccess: null,
    sketchfabAbort: null,
    sketchfabUploadProcessing: null,

    donate: null,

    alphaNone: null,
    alphaSquare: null,
    alphaSkin: null,

    envFootPrint: null,
    envGlazedPatio: null,
    envNicolausChurch: null,
    envTerrace: null,
    envBryantPark: null
  };

  return TR;
});