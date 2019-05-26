var TR = {
  // background
  backgroundTitle: 'Fond d\'écran',
  backgroundReset: 'Réinitialiser',
  backgroundImport: 'Importer (jpg, png...)',
  backgroundFill: 'Remplir',

  // camera
  cameraTitle: 'Caméra',
  cameraReset: 'Vue',
  cameraCenter: 'Reset (bar)',
  cameraFront: 'De face (F)',
  cameraLeft: 'De gauche (L)',
  cameraTop: 'De haut (T)',
  cameraMode: 'Mode',
  cameraOrbit: 'Orbite (Turntable)',
  cameraSpherical: 'Spherique (Trackball)',
  cameraPlane: 'Planaire (Trackball)',
  cameraProjection: 'Projection',
  cameraPerspective: 'Perspective',
  cameraOrthographic: 'Orthographique',
  cameraFov: 'Champs de vision',
  cameraPivot: 'Point de pivot',

  // file
  fileTitle: 'Fichiers (importer/exporter)',
  fileImportTitle: 'Importer',
  fileAdd: 'Ajouter (obj, sgl, ply, stl)',
  fileAutoMatrix: 'Mise a l\'échelle et centrage',
  fileVertexSRGB: 'Couleur de vertex en sRGB',
  fileExportSceneTitle: 'Exporter Scene',
  fileExportAll: 'Tout exporter',
  fileExportSGL: 'Sauver .sgl (SculptGL)',
  fileExportOBJ: 'Sauver .obj',
  fileExportPLY: 'Sauver .ply',
  fileExportSTL: 'Sauver .stl',

  fileExportTextureTitle: null,
  fileExportTextureSize: null,
  fileExportColor: null,
  fileExportRoughness: null,
  fileExportMetalness: null,

  // scene
  sceneTitle: 'Scène',
  sceneReset: 'Réinitialiser scène',
  sceneResetConfirm: 'Confirmer réinitialiser la scène?',
  sceneAddSphere: 'Ajouter sphere',
  sceneAddCube: 'Ajouter cube',
  sceneAddCylinder: 'Ajouter cylindre',
  sceneAddTorus: 'Ajouter tore',
  sceneSelection: 'Sélection',
  sceneMerge: 'Fusionner selection',
  sceneDuplicate: null,
  sceneDelete: 'Supprimer la sélection',

  // mesh
  meshTitle: 'Mesh',
  meshNbVertices: 'Vertex : ',
  meshNbFaces: 'Faces : ',

  // topology
  topologyTitle: 'Topologie',

  //multires
  multiresTitle: 'Multirésolution',
  multiresSubdivide: 'Subdiviser',
  multiresReverse: 'Inverser',
  multiresResolution: 'Résolution',
  multiresNoLower: 'Il n\'y a pas de niveau de résolution inférieur.',
  multiresNoHigher: 'Il n\'y a pas de niveau de résolution plus élevé.',
  multiresDelHigher: 'Suppression supérieur',
  multiresDelLower: 'Suppression inférieur',
  multiresSelectLowest: 'Sélectionnez la résolution la plus basse avant d\'inverser.',
  multiresSelectHighest: 'Sélectionnez la résolution la plus élevée avant de subdiviser.',
  multiresWarnBigMesh: function (nbFacesNext) {
    return 'Le prochain niveau de subdivision atteindra ' + nbFacesNext + ' faces.\n' +
      'Si vous savez ce que vous faites, cliquez de nouveau sur "subdiviser".';
  },
  multiresNotReversible: 'Désolé, il n\'est pas possible d\'inverser ce maillage.\n' +
    'Le mesh n\'est pas un produit d\'une surface de subdivision (loop-catmull) provenant manifold.',

  // remesh
  remeshTitle: 'Remaillage volumétrique',
  remeshRemesh: 'Remaillage',
  remeshResolution: 'Résolution',
  remeshBlock: 'Bloc',

  // dynamic
  dynamicTitle: 'Topologie dynamique',
  dynamicActivated: 'Activaté (pas quads)',
  dynamicSubdivision: 'Subdivision',
  dynamicDecimation: 'Décimation',
  dynamicLinear: 'Subdivision linéaire',

  // sculpt
  sculptTitle: 'Sculpture & Painture',
  sculptBrush: 'Brosse',
  sculptInflate: 'Gonfler',
  sculptTwist: 'Tordre',
  sculptSmooth: 'Lisser (-Shift)',
  sculptFlatten: 'Aplatir',
  sculptPinch: 'Pincer',
  sculptCrease: 'Plier',
  sculptDrag: 'Tirer',
  sculptPaint: 'Peindre',
  sculptMasking: 'Masquer (-Ctrl)',
  sculptMove: 'Bouger',
  sculptLocalScale: 'Mise à l\'échelle locale',
  sculptTransform: 'Transformer (E)',

  sculptCommon: 'Commun',
  sculptTool: 'Outil',
  sculptSymmetry: 'Symétrie',
  sculptContinuous: 'Continu',
  sculptRadius: 'Rayon (-X)',
  sculptIntensity: 'Intensité (-C)',
  sculptHardness: 'Dureté',
  sculptCulling: 'Surface fine (vertex de face uniquement)',
  sculptAlphaTitle: 'Alpha',
  sculptLockPositon: 'Bloquer position',
  sculptAlphaTex: 'Texture',
  sculptImportAlpha: 'Importer texture alpha (jpg, png...)',
  sculptNegative: 'Négatif (N ou -Alt)',
  sculptColor: 'Albedo',
  sculptRoughness: 'Rugosité',
  sculptMetallic: 'Métallique',
  sculptClay: 'Argile',
  sculptAccumulate: 'Accumuler effet',
  sculptColorGlobal: 'Global',
  sculptPickColor: 'Matériau / selection de couleur (-S)',
  sculptTangentialSmoothing: 'Relaxer uniquement',
  sculptTopologicalCheck: 'Vérification topologique',
  sculptMoveAlongNormal: 'Extruder suivant la normale (N ou -Alt)',
  sculptMaskingClear: 'Reset (-Ctrl + Drag)',
  sculptMaskingInvert: 'Inverser (-Ctrl + Click)',
  sculptMaskingBlur: 'Brouiller',
  sculptMaskingSharpen: 'Aiguiser',
  sculptPBRTitle: 'Matériaux physiques (PBR)',
  sculptPaintAll: 'Peindre tout',
  sculptExtractTitle: 'Extraire',
  sculptExtractThickness: 'Epaisseur',
  sculptExtractAction: 'Extraire !',

  // states
  stateTitle: 'Historique',
  stateUndo: 'Annuler',
  stateRedo: 'Refaire',
  stateMaxStack: 'Nombre maximale d\'action',

  // pressure
  pressureTitle: 'Pression de la tablette',
  pressureRadius: 'Pression sur le rayon',
  pressureIntensity: 'Pression sur l\'intensité',

  // rendering
  renderingTitle: 'Rendu',
  renderingGrid: 'Afficher grille',
  renderingSymmetryLine: 'Afficher ligne de symétrie',
  renderingMatcap: 'Matcap',
  renderingCurvature: 'Courbure',
  renderingPBR: 'PBR',
  renderingTransparency: 'Transparence',
  renderingNormal: 'Normal shader',
  renderingUV: 'UV shader',
  renderingShader: 'Shader',
  renderingMaterial: 'Matériau',
  renderingImportUV: 'Importer (jpg, png...)',
  renderingImportMatcap: 'Importer (jpg, png...)',
  renderingExtra: 'Extra',
  renderingFlat: 'Ombrage plat',
  renderingWireframe: 'Fil de fer (W)',
  renderingExposure: 'Exposition',
  renderingEnvironment: 'Environment',
  renderingIsolate: 'Isoler/Afficher (I)',
  renderingFilmic: 'Tonemapping filmique',

  // contour
  contour: 'Contour',
  contourShow: 'Afficher les contours',
  contourColor: 'Couleur',
  darkenUnselected: 'Assombrir non séléctioné',

  // pixel ratio
  resolution: 'Résolution',

  // matcaps
  matcapPearl: 'Perle',
  matcapClay: 'Argile',
  matcapSkin: 'Peau',
  matcapGreen: 'Vert',
  matcapWhite: 'Blanc',

  // sketchfab
  sketchfabTitle: 'Vers Sketchfab !',
  sketchfabUpload: 'Uploader',
  sketchfabUploadMessage: 'Entrez votre clé d\'API sketchfab.\n',

  sketchfabUploadError: function (error) {
    return 'Sketchfab upload error :\n' + error;
  },
  sketchfabUploadSuccess: 'Téléchargement fini !\nVoici le lien :',
  sketchfabAbort: 'Annuler le dernier téléchargement ?',
  sketchfabUploadProcessing: 'En traitement...\nLe modèle sera disponible sur :',

  about: 'A propos & aide',

  alphaNone: 'Vide',
  alphaSquare: 'Carré',
  alphaSkin: 'Peau',

  remeshTitleMC: 'Remaillage surfacique (manifold tris)',
  remeshRemeshMC: 'Remaillage',
  remeshSmoothingMC: 'Lisser topologie'
};

export default TR;
