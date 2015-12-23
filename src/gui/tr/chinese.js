define(function (require, exports, module) {

  'use strict';

  var TR = {
    // background
    backgroundTitle: '背景',
    backgroundReset: '重設',
    backgroundImport: '匯入 (jpg, png...)',
    backgroundFill: '填色',

    // camera
    cameraTitle: '鏡頭',
    cameraReset: '檢視',
    cameraCenter: '重設 (空白鍵)',
    cameraFront: '前視角 (F)',
    cameraLeft: '左視角 (L)',
    cameraTop: '俯視角 (T)',
    cameraMode: '模式',
    cameraOrbit: '軌道 (轉盤)',
    cameraSpherical: '球面 (軌跡球)',
    cameraPlane: '平面 (軌跡球)',
    cameraProjection: '投影',
    cameraPerspective: '透視角',
    cameraOrthographic: '等視角',
    cameraFov: '視野範圍',
    cameraPivot: '選擇軸心',

    // file
    fileTitle: '檔案 (匯入/匯出)',
    fileImportTitle: '匯入',
    fileAdd: '加入 (obj, sgl, ply, stl)',
    fileAutoMatrix: null,
    fileVertexSRGB: null,
    fileExportMeshTitle: '匯出網面',
    fileExportSceneTitle: '匯出場景',
    fileExportSGL: '儲存 .sgl (SculptGL)',
    fileExportOBJ: '儲存 .obj',
    fileExportPLY: '儲存 .ply',
    fileExportSTL: '儲存 .stl',

    // scene
    sceneTitle: '場景',
    sceneReset: '清除場景',
    sceneAddSphere: '加入球體',
    sceneAddCube: null,
    sceneAddCylinder: null,
    sceneAddTorus: null,
    sceneSelection: null,
    sceneMerge: null,

    // mesh
    meshTitle: '網面',
    meshNbVertices: '頂點 : ',
    meshNbFaces: '面 : ',

    // topology
    topologyTitle: '網面結構',

    //multires
    multiresTitle: '多重解析度',
    multiresSubdivide: '細分',
    multiresReverse: '反轉',
    multiresResolution: '解析度',
    multiresNoLower: '沒有更低等級的解析度。',
    multiresNoHigher: '沒有更高等級的解析度。',
    multiresDelHigher: '刪除較高等級',
    multiresDelLower: '刪除較低等級',
    multiresSelectLowest: '反轉前請先選擇最低的解析度。',
    multiresSelectHighest: '細分前請先選擇最高的解析度。',
    multiresWarnBigMesh: function (nbFacesNext) {
      return '下一個細分等級會達到 ' + nbFacesNext + ' 個面。\n' +
        '若你清楚你自己正在做什麼，再點擊「細分」一次。';
    },
    multiresNotReversible: '抱歉，無法反轉此網面。\n' +
      '此網面不是由流形網面經過細分曲面 (loop-catmull) 而來。',

    // remesh
    remeshTitle: '立體像素網面重構',
    remeshRemesh: '網面重構',
    remeshResolution: '解析度',
    remeshBlock: null,

    // dynamic
    dynamicTitle: '動態網面結構',
    dynamicActivated: '已啟用 (無四邊形)',
    dynamicSubdivision: '細分',
    dynamicDecimation: '削減面數',
    dynamicLinear: '線性細分',

    // sculpt
    sculptTitle: '雕刻和塗繪',
    sculptBrush: '筆刷',
    sculptInflate: '膨脹',
    sculptTwist: '扭轉',
    sculptSmooth: '平滑 (-Shift)',
    sculptFlatten: '抹平',
    sculptPinch: '夾捏',
    sculptCrease: '皺褶',
    sculptDrag: '拖拉',
    sculptPaint: '塗繪',
    sculptMasking: null,
    sculptMove: null,
    sculptLocalScale: null,
    sculptTransform: '縮放 移動 旋轉 (E)',

    sculptCommon: null,
    sculptTool: '工具',
    sculptSymmetry: '對稱',
    sculptContinuous: '連續',
    sculptRadius: '半徑 (-X)',
    sculptIntensity: '強度 (-C)',
    sculptHardness: null,
    sculptCulling: '薄曲面 (僅前面頂點)',
    sculptAlphaTitle: null,
    sculptLockPositon: null,
    sculptAlphaTex: null,
    sculptImportAlpha: null,
    sculptNegative: '反向 (N or -Alt)',
    sculptColor: '反照率',
    sculptRoughness: '粗糙度',
    sculptMetallic: '金屬',
    sculptClay: '黏土',
    sculptAccumulate: '累積 (每道筆劃無限制)',
    sculptColorGlobal: '全域',
    sculptPickColor: '選擇材質 (-S)',
    sculptTangentialSmoothing: '僅放鬆',
    sculptTopologicalCheck: null,
    sculptMoveAlongNormal: null,
    sculptMaskingClear: null,
    sculptMaskingInvert: null,
    sculptMaskingBlur: null,
    sculptMaskingSharpen: null,
    sculptPBRTitle: null,
    sculptPaintAll: null,
    sculptExtractTitle: null,
    sculptExtractThickness: null,
    sculptExtractAction: null,

    // states
    stateTitle: '記錄',
    stateUndo: '復原',
    stateRedo: '取消復原',
    stateMaxStack: '最大堆疊',

    // wacom
    wacomTitle: 'Wacom 繪圖板',
    wacomRadius: '感壓半徑',
    wacomIntensity: '感壓強度',

    // rendering
    renderingTitle: '繪算',
    renderingGrid: '顯示格線',
    renderingSymmetryLine: null,
    renderingMatcap: null,
    renderingCurvature: null,
    renderingPBR: '物理式繪算(PBR)',
    renderingTransparency: '透明',
    renderingNormal: '法線著色器',
    renderingUV: 'UV 著色器',
    renderingShader: '著色器',
    renderingMaterial: '材質',
    renderingImportUV: '匯入 (jpg, png...)',
    renderingImportMatcap: '匯入 (jpg, png...)',
    renderingExtra: '額外項目',
    renderingFlat: '平整面 (較慢)',
    renderingWireframe: '線框 (較慢) (W)',
    renderingExposure: null,
    renderingEnvironment: null,
    renderingIsolate: null,
    renderingFilmic: null,

    // contour
    contour: null,
    contourShow: null,
    contourColor: null,
    darkenUnselected: null,

    // pixel ratio
    resolution: null,

    // matcaps
    matcapPearl: '珍珠',
    matcapClay: '黏土',
    matcapSkin: '膚色',
    matcapGreen: '綠色',
    matcapWhite: '白色',

    // sketchfab
    sketchfabTitle: '前往 Sketchfab !',
    sketchfabUpload: '上傳',
    sketchfabUploadMessage: '請輸入你的 sketchfab API 密鑰。\n' +
      '你也可以留下 "guest" 進行匿名上傳。\n' +
      '(當上傳中和完成時會跳出新視窗)',
    sketchfabUploadError: function (error) {
      return 'Sketchfab 上傳錯誤 :\n' + error;
    },
    sketchfabUploadSuccess: '上傳成功 !\n這是你的連結 :',
    sketchfabAbort: '中止最近一次的上傳 ?',
    sketchfabUploadProcessing: null,

    about: null,

    alphaNone: null,
    alphaSquare: null,
    alphaSkin: null,

    envFootPrint: null,
    envGlazedPatio: null,
    envNicolausChurch: null,
    envTerrace: null,
    envBryantPark: null
  };

  module.exports = TR;
});