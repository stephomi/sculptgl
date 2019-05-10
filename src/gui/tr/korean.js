var TR = {
  // background
  backgroundTitle: '배경',
  backgroundReset: '초기화',
  backgroundImport: '가져오기 (jpg, png...)',
  backgroundFill: '화면 가득 채우기',

  // camera
  cameraTitle: '카메라',
  cameraReset: '뷰',
  cameraCenter: '초기화 (bar)',
  cameraFront: '앞쪽 (F)',
  cameraLeft: '왼쪽 (L)',
  cameraTop: '위쪽 (T)',
  cameraMode: '조작방식',
  cameraOrbit: '궤도 (Turntable)',
  cameraSpherical: '구형 (Trackball)',
  cameraPlane: '평면 (Trackball)',
  cameraProjection: '사영법',
  cameraPerspective: '투시원근법',
  cameraOrthographic: '정사영법',
  cameraFov: '시야각',
  cameraPivot: '피봇 찍기',

  // file
  fileTitle: '파일 (가져오기/내보내기)',
  fileImportTitle: '가져오기',
  fileAdd: '추가 (obj, sgl, ply, stl)',
  fileAutoMatrix: '크기조정 및 중앙정렬',
  fileVertexSRGB: 'sRGB 버텍스 색상',
  fileExportSceneTitle: '장면 내보내기',
  fileExportAll: '모두 내보내기',
  fileExportSGL: '.sgl 파일로 저장하기',
  fileExportOBJ: '.obj 파일로 저장하기',
  fileExportPLY: '.ply 파일로 저장하기',
  fileExportSTL: '.stl 파일로 저장하기',

  fileExportTextureTitle: null,
  fileExportTextureSize: null,
  fileExportColor: null,
  fileExportRoughness: null,
  fileExportMetalness: null,

  // scene
  sceneTitle: '장면',
  sceneReset: '모두 없애기',
  sceneResetConfirm: '모두 제거 확인',
  sceneAddSphere: '구 추가하기',
  sceneAddCube: '정육면체 추가하기',
  sceneAddCylinder: '기둥 추가하기',
  sceneAddTorus: '도넛 추가하기',
  sceneSelection: '선택',
  sceneMerge: '장면 병합하기',
  sceneDuplicate: null,
  sceneDelete: '선택 항목 삭제',

  // mesh
  meshTitle: '메시',
  meshNbVertices: '버텍스 개수 : ',
  meshNbFaces: '페이스 개수 : ',

  // topology
  topologyTitle: '토폴로지',

  //multires
  multiresTitle: '다중 해상도',
  multiresSubdivide: '세분화',
  multiresReverse: '간소화',
  multiresResolution: '해상도',
  multiresNoLower: '더 낮은 해상도가 존재하지 않습니다.',
  multiresNoHigher: '더 높은 해상도가 존재하지 않습니다.',
  multiresDelHigher: '상위 단계 제거',
  multiresDelLower: '하위 단계 제거',
  multiresSelectLowest: '간소화 하기 전에 더 낮은 해상도를 고르세요.',
  multiresSelectHighest: '세분화 하기 전에 더 높은 해상도를 고르세요',
  multiresWarnBigMesh: function (nbFacesNext) {
    return '다음 분할 단계의 면 개수는 ' + nbFacesNext + ' 개가 될 것입니다.\n' +
      '지금 뭘 하려는건지 정확히 이해하고 있다면 "세분화" 버튼을 다시 누르세요.';
  },
  multiresNotReversible: '이 메시는 더이상 병합할 수 없습니다.\n' +
    '이 메시는 다양체 메시상의 세분화(loop-catmull) 결과가 아닙니다.',

  // remesh
  remeshTitle: '복셀 리메싱',
  remeshRemesh: '리메시',
  remeshResolution: '해상도',
  remeshBlock: '각지게',

  // dynamic
  dynamicTitle: '동적 토폴로지',
  dynamicActivated: '활성화 (사각형 유지 안함)',
  dynamicSubdivision: '세분화',
  dynamicDecimation: '간소화',
  dynamicLinear: '선형 세분화',

  // sculpt
  sculptTitle: '스컬핑 & 페인팅',
  sculptBrush: '브러시',
  sculptInflate: '부풀리기',
  sculptTwist: '비틀기',
  sculptSmooth: '부드럽게 (-Shift)',
  sculptFlatten: '평평하게',
  sculptPinch: '꼬집기',
  sculptCrease: '주름내기',
  sculptDrag: '잡아끌기',
  sculptPaint: '칠하기',
  sculptMasking: '마스킹 (-Ctrl)',
  sculptMove: '잡아당기기',
  sculptLocalScale: '지역 스케일',
  sculptTransform: '변환 (E)',

  sculptCommon: '일반',
  sculptTool: '도구',
  sculptSymmetry: '대칭',
  sculptContinuous: '누적',
  sculptRadius: '반경 (-X)',
  sculptIntensity: '세기 (-C)',
  sculptHardness: '경도',
  sculptCulling: '얇은 표면 (앞쪽 면만 적용)',
  sculptAlphaTitle: '알파',
  sculptLockPositon: '위치 고정',
  sculptAlphaTex: '텍스쳐',
  sculptImportAlpha: '알파 텍스쳐 가져오기 (jpg, png...)',
  sculptNegative: '반전 (N 또는 -Alt)',
  sculptColor: '알베도',
  sculptRoughness: '거칠기',
  sculptMetallic: '금속',
  sculptClay: '찰흙',
  sculptAccumulate: '누적 (획 당으로 제한받지 않음)',
  sculptColorGlobal: null,
  sculptPickColor: '재질 / 색상 선택 (-S)',
  sculptTangentialSmoothing: '완화 한정',
  sculptTopologicalCheck: '위상 검사',
  sculptMoveAlongNormal: '법선 방향으로 움직이기',
  sculptMaskingClear: '초기화 (-Ctrl + Drag)',
  sculptMaskingInvert: '반전 (-Ctrl + Click)',
  sculptMaskingBlur: '흐리게',
  sculptMaskingSharpen: '선명하게',
  sculptPBRTitle: 'PBR 재질',
  sculptPaintAll: '전부 칠하기',
  sculptExtractTitle: '추출하기',
  sculptExtractThickness: '두께',
  sculptExtractAction: '추출!',

  // states
  stateTitle: '히스토리',
  stateUndo: '실행 취소',
  stateRedo: '다시 실행',
  stateMaxStack: '최대 실행취소 횟수',

  // pressure
  pressureTitle: '필압',
  pressureRadius: '필압반경',
  pressureIntensity: '필압 세기',

  // rendering
  renderingTitle: '렌더링',
  renderingGrid: '그리드 보기',
  renderingSymmetryLine: '대칭선 보기',
  renderingMatcap: '매트캡',
  renderingCurvature: '곡률 강조',
  renderingPBR: 'PBR',
  renderingTransparency: '투명도',
  renderingNormal: '노말 셰이더',
  renderingUV: 'UV 셰이더',
  renderingShader: '셰이더',
  renderingMaterial: '재질',
  renderingImportUV: '가져오기 (jpg, png...)',
  renderingImportMatcap: '가져오기 (jpg, png...)',
  renderingExtra: '그 외',
  renderingFlat: '플랫 셰이딩',
  renderingWireframe: '와이어프레임 (W)',
  renderingExposure: '노출',
  renderingEnvironment: '환경',
  renderingIsolate: '하나보기/모두보기 (I)',
  renderingFilmic: '영화적(filmic) 톤매핑',

  // contour
  contour: '윤곽선',
  contourShow: '윤곽선 보기',
  contourColor: '색상',
  darkenUnselected: '선택안된건 어둡게',

  // pixel ratio
  resolution: '해상도',

  // matcaps
  matcapPearl: '진주',
  matcapClay: '찰흙',
  matcapSkin: '피부',
  matcapGreen: '초록',
  matcapWhite: '하양',

  // sketchfab
  sketchfabTitle: 'Sketchfab에 올리기',
  sketchfabUpload: '올리기',
  sketchfabUploadMessage: null,
  // 

  sketchfabUploadError: null,
  // 

  sketchfabUploadSuccess: null,
  sketchfabAbort: null,
  sketchfabUploadProcessing: null,

  about: 'SculptGL 정보',

  alphaNone: null,
  alphaSquare: null,
  alphaSkin: null
};

export default TR;
