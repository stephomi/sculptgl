var TR = {
  // background
  backgroundTitle: 'Bakgrund',
  backgroundReset: 'Återställ',
  backgroundImport: 'Importera (jpg, png...)',
  backgroundFill: 'Fyll',

  // camera
  cameraTitle: 'Kamera',
  cameraReset: 'Vy',
  cameraCenter: 'Återställ (bar)',
  cameraFront: 'Fram (F)',
  cameraLeft: 'Vänster (L)',
  cameraTop: 'Över (T)',
  cameraMode: 'Läge',
  cameraOrbit: 'Omloppsbana (skivtallrik)',
  cameraSpherical: 'Sfärisk (trackball)',
  cameraPlane: 'Plan (trackball)',
  cameraProjection: 'Projektion',
  cameraPerspective: 'Perspektiv',
  cameraOrthographic: 'Ortografisk',
  cameraFov: 'Fov',
  cameraPivot: 'Plocka pivot',

  // file
  fileTitle: 'Filer (import/export)',
  fileImportTitle: 'Importera',
  fileAdd: 'Lägg till (obj, sgl, ply, stl)',
  fileAutoMatrix: 'Skala och centrera',
  fileVertexSRGB: 'sRGB vertexfärg',
  fileExportSceneTitle: 'Exportera Scen',
  fileExportAll: 'Exportera alla',
  fileExportSGL: 'Spara .sgl (SculptGL)',
  fileExportOBJ: 'Spara .obj',
  fileExportPLY: 'Spara .ply',
  fileExportSTL: 'Spara .stl',

  fileExportTextureTitle: null,
  fileExportTextureSize: null,
  fileExportColor: null,
  fileExportRoughness: null,
  fileExportMetalness: null,

  // scene
  sceneTitle: 'Scen',
  sceneReset: 'Rensa scen',
  sceneResetConfirm: 'Bekräfta klar scen',
  sceneAddSphere: 'Lägg till sfär',
  sceneAddCube: 'Lägg till kub',
  sceneAddCylinder: 'Lägg till cylinder',
  sceneAddTorus: 'Lägg till torus',
  sceneSelection: 'Urval',
  sceneMerge: 'Sammanfoga urval',
  sceneDuplicate: null,
  sceneDelete: 'Radera valet',

  // mesh
  meshTitle: 'Mesh',
  meshNbVertices: 'Vertex : ',
  meshNbFaces: 'Faces : ',

  // topology
  topologyTitle: 'Topologi',

  //multires
  multiresTitle: 'Upplösningar',
  multiresSubdivide: 'Dela upp yta',
  multiresReverse: 'Omvänd',
  multiresResolution: 'Upplösning',
  multiresNoLower: 'Det finns ingen lägre upplösningsnivå.',
  multiresNoHigher: 'Det finns ingen högre upplösningsnivå.',
  multiresDelHigher: 'Ta bort högre',
  multiresDelLower: 'Ta bort lägre',
  multiresSelectLowest: 'Välj den lägsta upplösningen innan omvändning.',
  multiresSelectHighest: 'Välj den högsta upplösningen innan uppdelning.',
  multiresWarnBigMesh: function (nbFacesNext) {
    return 'Nästa underavdelning nivå kommer att ha ' + nbFacesNext + ' faces.\n' +
      'Om du vet vad du gör, klicka igen på "dela upp yta".';
  },
  multiresNotReversible: 'Tyvärr, det går inte att omvända denna mesh.\n' +
    'Meshen är inte en produkt av en (loop-calmull) mångfaldsytindelning.',

  // remesh
  remeshTitle: 'Voxel Meshombyggnation',
  remeshRemesh: 'Bygg om mesh',
  remeshResolution: 'Upplösning',
  remeshBlock: 'Kuber',

  // dynamic
  dynamicTitle: 'Dynamisk Topologi',
  dynamicActivated: 'Aktiverad (inga quads)',
  dynamicSubdivision: 'Ytindelning',
  dynamicDecimation: 'Decimering',
  dynamicLinear: 'Linjär ytindelning',

  // sculpt
  sculptTitle: 'Skulptering & Måleri',
  sculptBrush: 'Pensel',
  sculptInflate: 'Blås upp',
  sculptTwist: 'Tvista',
  sculptSmooth: 'Jämna ut (-Shift)',
  sculptFlatten: 'Platta till',
  sculptPinch: 'Nyp',
  sculptCrease: 'Vecka',
  sculptDrag: 'Dra',
  sculptPaint: 'Måla',
  sculptMasking: 'Maskera (-Ctrl)',
  sculptMove: 'Flytta',
  sculptLocalScale: 'Skala lokalt',
  sculptTransform: 'Transformera (E)',

  sculptCommon: 'Generellt',
  sculptTool: 'Verktyg',
  sculptSymmetry: 'Symmetri',
  sculptContinuous: 'Kontinuerlig',
  sculptRadius: 'Radie (-X)',
  sculptIntensity: 'Intensitet (-C)',
  sculptHardness: 'Hårdhet',
  sculptCulling: 'Tunn yta (endast främre vertex)',
  sculptAlphaTitle: 'Alfa',
  sculptLockPositon: 'Lås position',
  sculptAlphaTex: 'Textur',
  sculptImportAlpha: 'Importera alfatextur (jpg, png...)',
  sculptNegative: 'Negativ (N or -Alt)',
  sculptColor: 'Albedo',
  sculptRoughness: 'Ytjämnhet',
  sculptMetallic: 'Metallisk',
  sculptClay: 'Lera',
  sculptAccumulate: 'Ackumulera (ingen gräns per strykning)',
  sculptColorGlobal: 'Global',
  sculptPickColor: 'Material / Färgvälgare (-S)',
  sculptTangentialSmoothing: 'Tangentiell utjämning',
  sculptTopologicalCheck: 'Topologisk check',
  sculptMoveAlongNormal: 'Flytta längsmed normal (N or -Alt)',
  sculptMaskingClear: 'Rensa (-Ctrl + Drag)',
  sculptMaskingInvert: 'Invertera (-Ctrl + Click)',
  sculptMaskingBlur: 'Gör suddig',
  sculptMaskingSharpen: 'Gör skarp',
  sculptPBRTitle: 'PBR-material',
  sculptPaintAll: 'Måla allt',
  sculptExtractTitle: 'Extrahera',
  sculptExtractThickness: 'Tjocklek',
  sculptExtractAction: 'Extrahera!',

  // states
  stateTitle: 'Historia',
  stateUndo: 'Ångra',
  stateRedo: 'Gör om',
  stateMaxStack: 'Ågra antal steg',

  // pressure
  pressureTitle: 'pressureplatta',
  pressureRadius: 'Tryckradie',
  pressureIntensity: 'Tryckintensitet',

  // rendering
  renderingTitle: 'Rendering',
  renderingGrid: 'Visa rutnät',
  renderingSymmetryLine: 'Visa speglingslinje',
  renderingMatcap: 'MatCap',
  renderingCurvature: 'Kurvatur',
  renderingPBR: 'PBR',
  renderingTransparency: 'Genomskinlighet',
  renderingNormal: 'Normal shader',
  renderingUV: 'UV-shader',
  renderingShader: 'Shader',
  renderingMaterial: 'Material',
  renderingImportUV: 'Importera (jpg, png...)',
  renderingImportMatcap: 'Importera (jpg, png...)',
  renderingExtra: 'Extra',
  renderingFlat: 'Platt shading',
  renderingWireframe: 'Wireframe (W)',
  renderingExposure: 'Exponering',
  renderingEnvironment: 'Miljö',
  renderingIsolate: 'Isolera/Visa (I)',
  renderingFilmic: 'Filmiska färgtoner',

  // contour
  contour: 'Kontur',
  contourShow: 'Visa kontur',
  contourColor: 'Färg',
  darkenUnselected: 'Skym ej valda',

  // pixel ratio
  resolution: 'Upplösning',

  // matcaps
  matcapPearl: 'Pärla',
  matcapClay: 'Lera',
  matcapSkin: 'Hud',
  matcapGreen: 'Grön',
  matcapWhite: 'Vit',

  // sketchfab
  sketchfabTitle: 'Gå till Sketchfab!',
  sketchfabUpload: 'Ladda upp',
  sketchfabUploadMessage: 'Vänligen fyll i din sketchfab API-nyckel.\n' +
    'Du kan även ange "guest" för att ladda upp anonymt.\n' +
    '(ett nytt fönster kommer att öppnas när uppladdning och bearbetning är klar)',
  sketchfabUploadError: function (error) {
    return 'Sketchfab uppladdningsfel:\n' + error;
  },
  sketchfabUploadSuccess: 'Uppladdning lyckades!\nHär är din länk:',
  sketchfabAbort: 'Avbryta senaste uppladdningen?',
  sketchfabUploadProcessing: 'Bearbetar...\nDin modell kommer bli tillgänglig här:',

  about: 'Om & Hjälp',

  alphaNone: 'Ingen',
  alphaSquare: 'Fyrkant',
  alphaSkin: 'Hud'
};

export default TR;
