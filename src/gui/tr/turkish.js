var TR = {
  // background
  backgroundTitle: 'Arka plan',
  backgroundReset: 'Temizle',
  backgroundImport: 'İçe Aktar (jpg, png...)',
  backgroundFill: 'Doldur',

  // camera
  cameraTitle: 'Kamera',
  cameraReset: 'Görünüm',
  cameraCenter: 'Temizle (boşluk)',
  cameraFront: 'Ön (F)',
  cameraLeft: 'Sol (L)',
  cameraTop: 'Üst (T)',
  cameraMode: 'Mod',
  cameraOrbit: 'Eksen (Döner Tabla)',
  cameraSpherical: 'Küresel (Trackball)',
  cameraPlane: 'Düzlem (Trackball)',
  cameraProjection: 'İz Düşüm',
  cameraPerspective: 'Perspektif',
  cameraOrthographic: 'Orthografik',
  cameraFov: 'Görüş Alanı',
  cameraPivot: 'Eksen',

  // file
  fileTitle: 'Dosyalar (içeri/dışarı)',
  fileImportTitle: 'İçe Aktar',
  fileAdd: 'Aktar (obj, sgl, ply, stl)',
  fileAutoMatrix: 'Ölçekle ve ortala',
  fileVertexSRGB: 'sRGB verteks renk',
  fileExportSceneTitle: 'Sahneyi Dışa Aktar',
  fileExportAll: 'tümünü ver',
  fileExportSGL: 'Kaydet .sgl (SculptGL)',
  fileExportOBJ: 'Kaydet .obj',
  fileExportPLY: 'Kaydet .ply',
  fileExportSTL: 'Kaydet .stl',

  fileExportTextureTitle: null,
  fileExportTextureSize: null,
  fileExportColor: null,
  fileExportRoughness: null,
  fileExportMetalness: null,

  // scene
  sceneTitle: 'Sahne',
  sceneReset: 'Sahneyi temizle',
  sceneResetConfirm: 'Net sahneyi doğrulayın',
  sceneAddSphere: 'Küre ekle',
  sceneAddCube: 'Küp ekle',
  sceneAddCylinder: 'Silindir ekle',
  sceneAddTorus: 'Halka ekle',
  sceneSelection: 'Seçim',
  sceneMerge: 'Seçimi birleştir',
  sceneDuplicate: null,
  sceneDelete: 'Seçimi sil',

  // mesh
  meshTitle: 'Nesne',
  meshNbVertices: 'Verteks : ',
  meshNbFaces: 'Cephe : ',

  // topology
  topologyTitle: 'Topoloji',

  //multires
  multiresTitle: 'Çoklu çözünürlük',
  multiresSubdivide: 'Böl',
  multiresReverse: 'Ters',
  multiresResolution: 'Çözünürlük',
  multiresNoLower: 'Daha düşük çözünürlük yok.',
  multiresNoHigher: 'Daha yüksek çözünürlük yok.',
  multiresDelHigher: 'Üst çözünürlüğü sil',
  multiresDelLower: 'Alt çözünürlüğü sil',
  multiresSelectLowest: 'Tersine çevirmeden önce en düşük çözünürlüğü seç.',
  multiresSelectHighest: 'Tesine çevirmeden önce en yüksek çözünürlüğü seç.',
  multiresWarnBigMesh: function (nbFacesNext) {
    return 'Sonraki çözünürlük ' + nbFacesNext + ' cepheden oluşacak.\n' +
      'Eğer devam etmek istiyorsanız, tekrar "böl" butonuna basın.';
  },
  multiresNotReversible: 'Malesef bu nesneyi tersine çevirmek mümkün değil.\n' +
    'The mesh is not a product of a (loop-catmull) subdivision surface on a manifold mesh.',

  // remesh
  remeshTitle: 'Voksel Remeshing',
  remeshRemesh: 'Remesh',
  remeshResolution: 'Çözünürlük',
  remeshBlock: 'Engelle',

  // dynamic
  dynamicTitle: 'Dinamik Topoloji',
  dynamicActivated: 'Aktifleştirildi (no quads)',
  dynamicSubdivision: 'Altbölüm',
  dynamicDecimation: 'Üstbölüm',
  dynamicLinear: 'Doğrusal altbölüm',

  // sculpt
  sculptTitle: 'Oyma & Boyama',
  sculptBrush: 'Fırça',
  sculptInflate: 'Şişir',
  sculptTwist: 'Bükülme',
  sculptSmooth: 'Yumuşat (-Shift)',
  sculptFlatten: 'Düzleştir',
  sculptPinch: 'Çimdik',
  sculptCrease: 'Kıvrım',
  sculptDrag: 'Sürükle',
  sculptPaint: 'Boya',
  sculptMasking: 'Maskeleme (-Ctrl)',
  sculptMove: 'Taşı',
  sculptLocalScale: 'Yerel ölçek',
  sculptTransform: 'Transform (E)',

  sculptCommon: 'Genel',
  sculptTool: 'Araç',
  sculptSymmetry: 'Simetri',
  sculptContinuous: 'Sürekli',
  sculptRadius: 'Yarıçağ (-X)',
  sculptIntensity: 'Yoğunluk (-C)',
  sculptHardness: 'Sertlik',
  sculptCulling: 'İnce yüzey (front vertex only)',
  sculptAlphaTitle: 'Alfa',
  sculptLockPositon: 'Pozisyonu kilitle',
  sculptAlphaTex: 'Kaplama',
  sculptImportAlpha: 'Alfa kaplama yükle (jpg, png...)',
  sculptNegative: 'Negatif (N or -Alt)',
  sculptColor: 'Aklık',
  sculptRoughness: 'Pürüzlülük',
  sculptMetallic: 'Metalik',
  sculptClay: 'Kil',
  sculptAccumulate: 'Biriktir (limitsiz)',
  sculptColorGlobal: 'Evrensel',
  sculptPickColor: 'Materyal / Renk seçici (-S)',
  sculptTangentialSmoothing: 'Rahatlat',
  sculptTopologicalCheck: 'Topoloji kontrol',
  sculptMoveAlongNormal: 'Normal boyunca taşı (N or -Alt)',
  sculptMaskingClear: 'Temizle (-Ctrl + Drag)',
  sculptMaskingInvert: 'Tersine çevir (-Ctrl + Click)',
  sculptMaskingBlur: 'Bulanıklaştır',
  sculptMaskingSharpen: 'Keskinleştir',
  sculptPBRTitle: 'PBR materyali',
  sculptPaintAll: 'Tümünü boya',
  sculptExtractTitle: 'Çıkar',
  sculptExtractThickness: 'Kalınlık',
  sculptExtractAction: 'Çıkar !',

  // states
  stateTitle: 'Geçmiş',
  stateUndo: 'Geri Al',
  stateRedo: 'İleri Al',
  stateMaxStack: 'Maksimum Yığın',

  // pressure
  pressureTitle: 'Tablet pressure',
  pressureRadius: 'Basınç çapı',
  pressureIntensity: 'Basınç hassasiyeti',

  // rendering
  renderingTitle: 'Sahneleme',
  renderingGrid: 'Izgarayı göster',
  renderingSymmetryLine: 'aynalama çizgisini göster',
  renderingMatcap: 'Matcap',
  renderingCurvature: 'Eğrilik',
  renderingPBR: 'PBR',
  renderingTransparency: 'Transparanlık',
  renderingNormal: 'Normal shader',
  renderingUV: 'UV shader',
  renderingShader: 'Shader',
  renderingMaterial: 'Materyal',
  renderingImportUV: 'İçe AKtar (jpg, png...)',
  renderingImportMatcap: 'İçe AKtar (jpg, png...)',
  renderingExtra: 'Ekstra',
  renderingFlat: 'Düz gölgeleme',
  renderingWireframe: 'Tel kafes (W)',
  renderingExposure: 'Teşir',
  renderingEnvironment: 'Ortam',
  renderingIsolate: 'İzole/Göster (I)',
  renderingFilmic: 'Film Ton Eşleşmesi',

  // contour
  contour: 'Kontür',
  contourShow: 'Kontürü göster',
  contourColor: 'Renk',
  darkenUnselected: 'Seçilmeyenleri koyu yap',

  // pixel ratio
  resolution: 'Çözünürlük',

  // matcaps
  matcapPearl: 'İnci',
  matcapClay: 'Kil',
  matcapSkin: 'Deri',
  matcapGreen: 'Yeşil',
  matcapWhite: 'Beyaz',

  // sketchfab
  sketchfabTitle: 'Sketchfab\'a git !',
  sketchfabUpload: 'Yükle',
  sketchfabUploadMessage: 'Lütfen sketchfab entegrasyon anahtarını giriniz.\n' +
    'Anonim olarak kullanmak için "guest" olarak bırakınız.\n' +
    '(İşleme ve yükleme tamamlandığında yeni bir pencere açılacak)',
  sketchfabUploadError: function (error) {
    return 'Sketchfab yükleme hatası :\n' + error;
  },
  sketchfabUploadSuccess: 'Yükleme başarılı !\nAdresiniz burada :',
  sketchfabAbort: 'Son yüklemeyi iptal et ?',
  sketchfabUploadProcessing: 'Hesaplanıyor...\nModeliniz şu adreste olacak :',

  about: 'Hakkında & Yardım',

  alphaNone: 'Hiç Biri',
  alphaSquare: 'Kare',
  alphaSkin: 'Deri'
};

export default TR;
