define([], function () {

  'use strict';

  var TR = {
    // config
    configTitle: '환경설정',

    // background
    backgroundTitle: '배경',
    backgroundReset: '초기화',
    backgroundImport: '배경 (jpg, png...)',
    backgroundFill: '채우기',

    // camera
    cameraTitle: '카메라',
    cameraReset: '뷰',
    cameraCenter: '초기화 (bar)',
    cameraFront: '앞쪽 (F)',
    cameraLeft: '왼쪽 (L)',
    cameraTop: '위쪽 (T)',
    cameraMode: '모드',
    cameraOrbit: '궤도 (Turntable)',
    cameraSpherical: '구 (Trackball)',
    cameraPlane: '평면 (Trackball)',
    cameraProjection: '투사',
    cameraPerspective: '원근법',
    cameraOrthographic: '정사영법',
    cameraFov: '시야각',
    cameraPivot: '피봇 고르기',

    // file
    fileTitle: '파일 (가져오기/내보내기)',
    fileImportTitle: '가져오기',
    fileAdd: '파일 (obj, sgl, ply, stl)',
    fileExportMeshTitle: '메쉬 내보내기',
    fileExportSceneTitle: '장면 내보내기',
    fileExportSGL: 'sgl로 저장하기',
    fileExportOBJ: 'obj로 저장하기',
    fileExportPLY: 'ply로 저장하기',
    fileExportSTL: 'stl로 저장하기',
    fileReplayerTitle: '리플레이어 (BETA)',
    fileReplayerImport: 'rep 로드하기',
    fileReplayerExport: 'rep 저장하기',
    fileReplayerUpload: 'Upload .rep (<10Mb)',
    fileReplayerUploadStart: 'Please confirm the upload. \nYour replay will be available at :',
    fileReplayerError: 'Error : replay file is too big (you probably imported a mesh). Clear scene will reset the replay file.',
    fileReplayerSuccess: 'Upload success !\nHere is your link :',
    fileReplayerAbort: 'Abort the last upload ?',

    // replayer
    replayTitle: '리플레이 환경설정',
    replayPaused: '정지',
    replaySpeed: '리플레이 속도',
    replayOverride: '덮기',

    // scene
    sceneTitle: '장면',
    sceneReset: '장면 초기화',
    sceneAddSphere: '구 추가하기 ',
    sceneAddCube: 'Add cube',

    // mesh
    meshTitle: '메쉬',
    meshNbVertices: '점들 : ',
    meshNbFaces: '면들 : ',

    // topology
    topologyTitle: '토폴로지',

    //multires
    multiresTitle: '다중 해상도',
    multiresSubdivide: '세분화',
    multiresReverse: '리버스',
    multiresResolution: '해상도',
    multiresNoLower: '더 낮은 해상도가 존재하지 않습니다.',
    multiresNoHigher: '더 높은 해상도가 존재하지 않습니다.',
    multiresDelHigher: '더 높은 것을 삭제',
    multiresDelLower: '더 낮은 것을 삭제',
    multiresSelectLowest: '리버싱 하기 전에 더 낮은 해상도를 고르세요.',
    multiresSelectHighest: '세분화 하기 전에 더 높은 해상도를 고르세요',
    multiresWarnBigMesh: function (nbFacesNext) {
      return '다음 세분화 레벨은 ' + nbFacesNext + ' 면만큼 도달할 것입니다.\n' +
        '만약 당신이 무엇을 하는지 안다면 "세분화"를 다시 클릭하세요.';
    },
    multiresNotReversible: '이 메쉬는 리버싱할 수 없습니다.\n' +
      '이 메쉬는 여러가지 메쉬의 표면의 세분화를 product한 것이 아닙니다.(loop-catmull)',

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
    sculptBrush: '브러쉬 (1)',
    sculptInflate: 'Inflate (2)',
    sculptTwist: 'Twist (3)',
    sculptSmooth: 'Smooth (4 or -Shift)',
    sculptFlatten: 'Flatten (5)',
    sculptPinch: 'Pinch (6)',
    sculptCrease: 'Crease (7)',
    sculptDrag: 'Drag (8)',
    sculptPaint: 'Paint (9)',
    sculptMasking: 'Masking (-Ctrl)',
    sculptMove: 'Move (0)',
    sculptLocalScale: 'Local scale',
    sculptScale: 'Scale (G)',
    sculptTranslate: 'Translate (E)',
    sculptRotate: 'Rotate (R)',
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
    sculptTranslateDepth: 'Depth translate (N or -Alt)',
    sculptRotateRoll: 'Roll rotate (N or -Alt)',
    sculptExtractTitle: 'Extract',
    sculptExtractThickness: 'Thickness',
    sculptExtractAction: 'Extract !',

    // states
    stateTitle: '역사',
    stateUndo: '되돌리기',
    stateRedo: '다시하기',
    stateMaxStack: '최대 스택',

    // wacom
    wacomTitle: '와콤 테블릿',
    wacomRadius: '압력 반지름',
    wacomIntensity: '압력 강도',

    // rendering
    renderingTitle: '렌더링',
    renderingGrid: '그리드 보이기',
    renderingSymmetryLine: '대칭선 보이기',
    renderingMatcap: 'Matcap',
    renderingPBR: 'PBR',
    renderingTransparency: '투명도',
    renderingNormal: '노말 쉐이더',
    renderingUV: 'UV 쉐이더',
    renderingShader: '쉐이더',
    renderingMaterial: '질',
    renderingImportUV: '가져오기 (jpg, png...)',
    renderingExtra: '추가',
    renderingFlat: '편평한 (느리게)',
    renderingWireframe: '와이어프레임 (느리게)',
    renderingExposure: 'Exposure',

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
    sketchfabTitle: 'Sketchfab으로 가기 !',
    sketchfabUpload: '올리기',
    sketchfabUploadMessage: 'Please enter your sketchfab API Key.\n' +
      'You can also leave "guest" to upload anonymously.\n' +
      '(a new window will pop up when the uploading and processing is finished)',
    sketchfabUploadError: function (error) {
      return 'Sketchfab upload error :\n' + error;
    },
    sketchfabUploadSuccess: 'Upload success !\nHere is your link :',
    sketchfabAbort: 'Abort the last upload ?',
    sketchfabUploadProcessing: 'Processing...\nYour model will be available at :',

    donate: 'Donate !'
  };

  return TR;
});