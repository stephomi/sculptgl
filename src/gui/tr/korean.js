define(function (require, exports, module) {

  'use strict';

  var TR = {
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
    fileAutoMatrix: null,
    fileVertexSRGB: null,
    fileExportMeshTitle: '메쉬 내보내기',
    fileExportSceneTitle: '장면 내보내기',
    fileExportSGL: 'sgl로 저장하기',
    fileExportOBJ: 'obj로 저장하기',
    fileExportPLY: 'ply로 저장하기',
    fileExportSTL: 'stl로 저장하기',

    // scene
    sceneTitle: '장면',
    sceneReset: '장면 초기화',
    sceneAddSphere: '구 추가하기 ',
    sceneAddCube: null,
    sceneAddCylinder: null,
    sceneAddTorus: null,
    sceneSelection: null,
    sceneMerge: null,

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
    sculptBrush: '브러쉬',
    sculptInflate: null,
    sculptTwist: null,
    sculptSmooth: null,
    sculptFlatten: null,
    sculptPinch: null,
    sculptCrease: null,
    sculptDrag: null,
    sculptPaint: null,
    sculptMasking: null,
    sculptMove: null,
    sculptLocalScale: null,
    sculptTransform: null,

    sculptCommon: null,
    sculptTool: null,
    sculptSymmetry: null,
    sculptContinuous: null,
    sculptRadius: null,
    sculptIntensity: null,
    sculptHardness: null,
    sculptCulling: null,
    sculptAlphaTitle: null,
    sculptLockPositon: null,
    sculptAlphaTex: null,
    sculptImportAlpha: null,
    sculptNegative: null,
    sculptColor: null,
    sculptRoughness: null,
    sculptMetallic: null,
    sculptClay: null,
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
    sculptPBRTitle: null,
    sculptPaintAll: null,
    sculptExtractTitle: null,
    sculptExtractThickness: null,
    sculptExtractAction: null,

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
    renderingMatcap: null,
    renderingCurvature: null,
    renderingPBR: null,
    renderingTransparency: '투명도',
    renderingNormal: '노말 쉐이더',
    renderingUV: 'UV 쉐이더',
    renderingShader: '쉐이더',
    renderingMaterial: '질',
    renderingImportUV: '가져오기 (jpg, png...)',
    renderingImportMatcap: '가져오기 (jpg, png...)',
    renderingExtra: '추가',
    renderingFlat: '편평한 (느리게)',
    renderingWireframe: '와이어프레임 (느리게) (W)',
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
    matcapPearl: null,
    matcapClay: null,
    matcapSkin: null,
    matcapGreen: null,
    matcapWhite: null,

    // sketchfab
    sketchfabTitle: 'Sketchfab으로 가기 !',
    sketchfabUpload: '올리기',
    sketchfabUploadMessage: null,
    // 

    sketchfabUploadError: null,
    // 

    sketchfabUploadSuccess: null,
    sketchfabAbort: null,
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