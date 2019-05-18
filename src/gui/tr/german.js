var TR = {
  // background
  backgroundTitle: 'Hintergrund',
  backgroundReset: 'Zurücksetzen',
  backgroundImport: 'Importieren (jpg, png...)',
  backgroundFill: 'Füllen',

  // camera
  cameraTitle: 'Kamera',
  cameraReset: 'Ansicht',
  cameraCenter: 'Reset (space)',
  cameraFront: 'Front (F)',
  cameraLeft: 'Links (L)',
  cameraTop: 'Oben (T)',
  cameraMode: 'Modus',
  cameraOrbit: 'Orbit (Drehscheibe)',
  cameraSpherical: 'Sphärisch (Rollkugel)',
  cameraPlane: 'Ebene (Rollkugel)',
  cameraProjection: 'Projektion',
  cameraPerspective: 'Perspektivisch',
  cameraOrthographic: 'Orthographisch',
  cameraFov: 'Sichtfeld (fov)',
  cameraPivot: 'Pivot auswählen',

  // file
  fileTitle: 'Datei (import/export)',
  fileImportTitle: 'Importieren',
  fileAdd: 'Hinzufügen (obj, sgl, ply, stl)',
  fileAutoMatrix: 'Skalieren und zentrieren',
  fileVertexSRGB: 'Vertexfarbe sRGB',
  fileExportSceneTitle: 'Exportieren',
  fileExportAll: 'Alles Exportieren',
  fileExportSGL: 'Speichern .sgl (SculptGL)',
  fileExportOBJ: 'Speichern .obj',
  fileExportPLY: 'Speichern .ply',
  fileExportSTL: 'Speichern .stl',

  fileExportTextureTitle: 'Texturen exportieren',
  fileExportTextureSize: 'Größe',
  fileExportColor: 'Farben speichern',
  fileExportRoughness: 'Rauheit speichern',
  fileExportMetalness: 'Metallisches speichern',

  // scene
  sceneTitle: 'Szene',
  sceneReset: 'Szene löschen',
  sceneResetConfirm: 'Bestätige das Löschen der aktuellen Szene',
  sceneAddSphere: 'Kugel hinzufügen',
  sceneAddCube: 'Würfel hinzufügen',
  sceneAddCylinder: 'Zylinder hinzufügen',
  sceneAddTorus: 'Torus hinzufügen',
  sceneSelection: 'Auswahl',
  sceneMerge: 'Auswahl zusammenführen',
  sceneDuplicate: 'Auswahl kopieren',
  sceneDelete: 'Auswahl löschen',

  // mesh
  meshTitle: 'Mesh',
  meshNbVertices: 'Vertex : ',
  meshNbFaces: 'Faces : ',

  // topology
  topologyTitle: 'Topologie',

  //multires
  multiresTitle: 'Mehrfachauflösung',
  multiresSubdivide: 'Aufteilen',
  multiresReverse: 'Umkehren',
  multiresResolution: 'Auflösung',
  multiresNoLower: 'Es gibt keine kleinere Auflösung.',
  multiresNoHigher: 'Es gibt keine höhere Auflösung.',
  multiresDelHigher: 'Höhere löschen',
  multiresDelLower: 'Niedrigere löschen',
  multiresSelectLowest: 'Wählen Sie vor dem Umkehren die kleinste Auflösung aus.',
  multiresSelectHighest: 'Wählen Sie vor dem Umkehren die höchste Auflösung aus.',
  multiresWarnBigMesh: function (nbFacesNext) {
    return 'Die nächste Unterteilungsebene wird ' + nbFacesNext + ' Flächen erreichen\n' +
      'Wenn Sie wissen, was Sie tun, dann klicken Sie nocheinmal auf "umkehren".';
  },
  multiresNotReversible: 'Es ist leider nicht möglich dieses Netz umzukehren.\n' +
    'Das Netz ist kein Produkt einer (loop/catmull) Unterteilungsfläche auf eines mannigfaltigen Netzes',

  // remesh
  remeshTitle: 'Voxel remeshing (Vierecke)',
  remeshRemesh: 'Remesh',
  remeshResolution: 'Auflösung',
  remeshBlock: 'Block',

  // dynamic
  dynamicTitle: 'Dynamische Topologie',
  dynamicActivated: 'Aktiviert (ohne Vierecke)',
  dynamicSubdivision: 'Aufteilung',
  dynamicDecimation: 'Dezimierung',
  dynamicLinear: 'Lineare Aufteilung',

  // sculpt
  sculptTitle: 'Modellieren & Bemalen',
  sculptBrush: 'Pinsel',
  sculptInflate: 'Aufblasen',
  sculptTwist: 'Verdrehen',
  sculptSmooth: 'Glätten (-Shift)',
  sculptFlatten: 'Ebnen',
  sculptPinch: 'Kneifen',
  sculptCrease: 'Falten',
  sculptDrag: 'Ziehen',
  sculptPaint: 'Malen',
  sculptMasking: 'Maskieren (-Strg)',
  sculptMove: 'Bewegen',
  sculptLocalScale: 'Lokales Skalieren',
  sculptTransform: 'Transformieren (E)',

  sculptCommon: 'Allgemein',
  sculptTool: 'Werkzeuge',
  sculptSymmetry: 'Symmetrie',
  sculptContinuous: 'Kontinuierlich',
  sculptRadius: 'Radius (-X)',
  sculptIntensity: 'Intensität (-C)',
  sculptHardness: 'Härte',
  sculptCulling: 'Dünne Oberfläche (nur vorderer vertex)',
  sculptAlphaTitle: 'Alpha',
  sculptLockPositon: 'Verriegelungsposition',
  sculptAlphaTex: 'Textur',
  sculptImportAlpha: 'Alpha tex importieren(jpg, png...)',
  sculptNegative: 'Negativ (N or -Alt)',
  sculptColor: 'Albedo',
  sculptRoughness: 'Rauheit',
  sculptMetallic: 'Metallisches',
  sculptClay: 'Lehm',
  sculptAccumulate: 'Akkumulieren (Kein Limit pro Anschlag)',
  sculptColorGlobal: 'Global',
  sculptPickColor: 'Material / Farb Auswahl (-S)',
  sculptTangentialSmoothing: 'Tangentiale Glättung',
  sculptTopologicalCheck: 'Topologischer Check',
  sculptMoveAlongNormal: 'Normal weiterlaufen (N or -Alt)',
  sculptMaskingClear: 'Löschen (-Ctrl + Drag)',
  sculptMaskingInvert: 'Invertieren (-Ctrl + Click)',
  sculptMaskingBlur: 'Verwischen',
  sculptMaskingSharpen: 'Schärfen',
  sculptPBRTitle: 'PBR Materialen',
  sculptPaintAll: 'Alles Anmalen',
  sculptExtractTitle: 'Extrahieren',
  sculptExtractThickness: 'Dicke',
  sculptExtractAction: 'Extrahieren !',

  // states
  stateTitle: 'Verlauf',
  stateUndo: 'Rückgängig',
  stateRedo: 'Wiederholen',
  stateMaxStack: 'Max. Schritte',

  // pressure
  pressureTitle: 'Tablet Druck',
  pressureRadius: 'Druckradius',
  pressureIntensity: 'Druckintensität',

  // rendering
  renderingTitle: 'Rendering',
  renderingGrid: 'Gitter anzeigen',
  renderingSymmetryLine: 'Spiegellinie anzeigen',
  renderingMatcap: 'Matcap',
  renderingCurvature: 'Krümmung',
  renderingPBR: 'PBR',
  renderingTransparency: 'Transparenz',
  renderingNormal: 'Normale Shader',
  renderingUV: 'UV shader',
  renderingShader: 'Shader',
  renderingMaterial: 'Material',
  renderingImportUV: 'Importieren (jpg, png...)',
  renderingImportMatcap: 'Importieren (jpg, png...)',
  renderingExtra: 'Extra',
  renderingFlat: 'Flaches Schattieren',
  renderingWireframe: 'Drahtgitter (W)',
  renderingExposure: 'Belichtung',
  renderingEnvironment: 'Umgebung',
  renderingIsolate: 'Isoliert/Zeige (I)',
  renderingFilmic: 'Filmische Tonzuordnung',

  // contour
  contour: 'Kontur',
  contourShow: 'Kontur anzeigen',
  contourColor: 'Farbe',
  darkenUnselected: 'Nicht markiertes abdunkeln',

  // pixel ratio
  resolution: 'Auflösung',

  // matcaps
  matcapPearl: 'Perle',
  matcapClay: 'Ton',
  matcapSkin: 'Haut',
  matcapGreen: 'Grün',
  matcapWhite: 'Weiß',

  // sketchfab
  sketchfabTitle: 'Hier gehts zu Sketchfab !',
  sketchfabUpload: 'Hochladen',
  sketchfabUploadMessage: 'Please enter your sketchfab API Key.\n' +
    'You can also leave "guest" to upload anonymously.\n' +
    '(a new window will pop up when the uploading and processing is finished)',
  sketchfabUploadError: function (error) {
    return 'Sketchfab upload error :\n' + error;
  },
  sketchfabUploadSuccess: 'Upload success !\nHere is your link :',
  sketchfabAbort: 'Abort the last upload ?',
  sketchfabUploadProcessing: 'Processing...\nYour model will be available at :',

  about: 'Über & Hilfe (Englisch)',

  alphaNone: 'None',
  alphaSquare: 'Würfel',
  alphaSkin: 'Haut',

  remeshTitleMC: 'Voxel remeshing (mannigfaltige Dreiecke)',
  remeshRemeshMC: 'Remesh',
  remeshSmoothingMC: 'Topologie entspannen'
};

export default TR;