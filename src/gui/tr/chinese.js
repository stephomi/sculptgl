var TR = {
  // background
  backgroundTitle: '背景',
  backgroundReset: '重設',
  backgroundImport: '匯入 (jpg, png...)',
  backgroundFill: '填充',

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
  fileAutoMatrix: '縮放並置中',
  fileVertexSRGB: 'sRGB 頂點色彩',
  fileExportSceneTitle: '匯出場景',
  fileExportAll: '匯出出口',
  fileExportSGL: '儲存 .sgl (SculptGL)',
  fileExportOBJ: '儲存 .obj',
  fileExportPLY: '儲存 .ply',
  fileExportSTL: '儲存 .stl',

  fileExportTextureTitle: null,
  fileExportTextureSize: null,
  fileExportColor: null,
  fileExportRoughness: null,
  fileExportMetalness: null,

  // scene
  sceneTitle: '場景',
  sceneReset: '清除場景',
  sceneResetConfirm: '確認清除場景',
  sceneAddSphere: '加入球體',
  sceneAddCube: '加入立方體',
  sceneAddCylinder: '加入圓柱',
  sceneAddTorus: '加入圓環',
  sceneSelection: '選取項目',
  sceneMerge: '合併選取項目',
  sceneDuplicate: '刪除選擇',
  sceneDuplicate: null,

  // mesh
  meshTitle: '網面',
  meshNbVertices: '頂點 : ',
  meshNbFaces: '面 : ',

  // topology
  topologyTitle: '網面結構(拓撲)',

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
  remeshBlock: '塊狀重構',

  // dynamic
  dynamicTitle: '動態網面結構',
  dynamicActivated: '啟用 (無四邊形)',
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
  sculptPinch: '捏塑',
  sculptCrease: '皺褶',
  sculptDrag: '拖拉',
  sculptPaint: '塗繪',
  sculptMasking: '遮罩 (-Ctrl)',
  sculptMove: '移動',
  sculptLocalScale: '局部縮放',
  sculptTransform: '變形 (E)',

  sculptCommon: '通用',
  sculptTool: '工具',
  sculptSymmetry: '對稱',
  sculptContinuous: '連續',
  sculptRadius: '半徑 (-X)',
  sculptIntensity: '強度 (-C)',
  sculptHardness: '硬度',
  sculptCulling: '薄曲面 (僅影響前面頂點)',
  sculptAlphaTitle: '透明色版 (Alpha)',
  sculptLockPositon: '鎖定位置',
  sculptAlphaTex: '紋理',
  sculptImportAlpha: '匯入 alpha 紋理 (jpg, png...)',
  sculptNegative: '反向 (N 或 -Alt)',
  sculptColor: '反照率',
  sculptRoughness: '粗糙度',
  sculptMetallic: '金屬性',
  sculptClay: '黏土',
  sculptAccumulate: '累積 (每道筆劃無限制)',
  sculptColorGlobal: '總體',
  sculptPickColor: '選擇材質或顏色 (-S)',
  sculptTangentialSmoothing: '僅放鬆',
  sculptTopologicalCheck: '網面結構檢查',
  sculptMoveAlongNormal: '沿法線方向移動 (N 或 -Alt)',
  sculptMaskingClear: '清除 (-Ctrl + 拖動)',
  sculptMaskingInvert: '反轉 (-Ctrl + 點擊)',
  sculptMaskingBlur: '模糊',
  sculptMaskingSharpen: '銳利化',
  sculptPBRTitle: 'PBR 材質',
  sculptPaintAll: '塗繪全部',
  sculptExtractTitle: '提取',
  sculptExtractThickness: '厚度',
  sculptExtractAction: '提取 !',

  // states
  stateTitle: '記錄',
  stateUndo: '復原',
  stateRedo: '取消復原',
  stateMaxStack: '最大推疊',

  // pressure
  pressureTitle: '感壓繪圖板',
  pressureRadius: '半徑感壓',
  pressureIntensity: '強度感壓',

  // rendering
  renderingTitle: '圖形繪算',
  renderingGrid: '顯示格線',
  renderingSymmetryLine: '顯示鏡像線',
  renderingMatcap: '材質捕捉 (Matcap)',
  renderingCurvature: '曲率',
  renderingPBR: '物理式繪算(PBR)',
  renderingTransparency: '透明',
  renderingNormal: '法線著色器',
  renderingUV: 'UV 著色器',
  renderingShader: '著色器',
  renderingMaterial: '材質',
  renderingImportUV: '匯入 (jpg, png...)',
  renderingImportMatcap: '匯入 (jpg, png...)',
  renderingExtra: '額外',
  renderingFlat: '平整面',
  renderingWireframe: '線框 (W)',
  renderingExposure: '曝光',
  renderingEnvironment: '環境',
  renderingIsolate: '隔離/顯示 (I)',
  renderingFilmic: '電影色調對應',

  // contour
  contour: '輪廓',
  contourShow: '顯示輪廓',
  contourColor: '顏色',
  darkenUnselected: '未選取部分變暗',

  // pixel ratio
  resolution: '解析度',

  // matcaps
  matcapPearl: '珍珠',
  matcapClay: '黏土',
  matcapSkin: '膚色',
  matcapGreen: '綠色',
  matcapWhite: '白色',

  // sketchfab
  sketchfabTitle: '前往 Sketchfab !',
  sketchfabUpload: '上傳',
  sketchfabUploadMessage: '請輸入你的 sketchfab API 密鑰.\n' +
    '你也可以不填寫留下 "guest" 進行匿名上傳。\n' +
    '(當上傳中和完成時會跳出新視窗)',
  sketchfabUploadError: function (error) {
    return 'Sketchfab 上傳錯誤 :\n' + error;
  },
  sketchfabUploadSuccess: '上傳成功 !\n這是你的連結 :',
  sketchfabAbort: '中止最後上傳的項目 ?',
  sketchfabUploadProcessing: '處理中...\n你的模型將會存放在：',

  about: '關於和說明',

  alphaNone: '無',
  alphaSquare: '方塊',
  alphaSkin: '皮膚'
};

export default TR;
