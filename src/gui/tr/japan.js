define([], function () {

  'use strict';

  var TR = {
    // config
    configTitle: 'Config',

    // background
    backgroundTitle: 'バックグラウンド',
    backgroundReset: 'リセット',
    backgroundImport: 'インポート  (jpg, png...)',

    // camera
    cameraTitle: 'カメラ',
    cameraReset: 'リセット',
    cameraFront: 'Front view (F)',
    cameraLeft: 'Left view (L)',
    cameraTop: 'Top view (T)',
    cameraMode: 'モード',
    cameraOrbit: 'Orbit',
    cameraSpherical: '球体',
    cameraPlane: '平面',
    cameraType: 'タイプ',
    cameraPerspective: '透視投影',
    cameraOrthographic: '平行投影',
    cameraFov: '視野',
    cameraPivot: 'ピボット選択',

    // file
    fileTitle: 'ファイル (インポート/エクスポート)',
    fileReset: 'ボールの初期化',
    fileAdd: 'インポート (obj,ply,stl)',
    fileExportOBJ: 'エクスポート (obj形式)',
    fileExportPLY: 'エクスポート (ply形式)',
    fileExportSTL: 'エクスポート (stl形式)',

    // mesh
    meshTitle: 'メッシュ',
    meshNbVertices: 'Ver : ',
    meshNbFaces: 'Faces : ',

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
      'The mesh is not a product of a (loop-catmull) subdivision surface.',

    // remesh
    remeshTitle: 'Remesh',
    remeshRemesh: 'Remesh',
    remeshResolution: 'Resolution',

    // sculpt
    sculptTitle: 'ボールの加工',
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
    sculptCulling: '不要造形除去？',
    sculptNegative: 'ネガティブ (N)',
    sculptColor: 'カラー',
    sculptClay: 'クレイ',
    sculptAccumulate: 'Accumulate',
    sculptPickColor: 'Pick color',
    sculptTangentialSmoothing: 'No shrink',

    // states
    stateTitle: '履歴',
    stateUndo: 'アンドゥ (Ctrl+Z)',
    stateRedo: 'リドゥ (Ctrl+Y)',

    // wacom
    wacomTitle: 'ワコムタブレット',
    wacomRadius: '圧力半径？',
    wacomIntensity: '圧力の強さ？',

    // sketchfab
    renderingTitle: 'Rendering',
    renderingMatcap: 'Matcap',
    renderingPhong: 'フォン',
    renderingTransparency: '透過',
    renderingNormal: 'ノーマル',
    renderingUV: 'UV shader',
    renderingShader: 'シェーダー',
    renderingMaterial: 'Material',
    renderingImportUV: 'Import (jpg, png...)',
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