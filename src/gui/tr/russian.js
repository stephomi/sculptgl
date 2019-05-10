var TR = {
  // background
  backgroundTitle: 'Фон',
  backgroundReset: 'Сброс',
  backgroundImport: 'Импорт (jpg, png...)',
  backgroundFill: 'Заполнить',

  // camera
  cameraTitle: 'Камера',
  cameraReset: 'Вид',
  cameraCenter: 'Сброс (bar)',
  cameraFront: 'Спереди (F)',
  cameraLeft: 'Слева (L)',
  cameraTop: 'Сверху (T)',
  cameraMode: 'Режим камеры',
  cameraOrbit: 'Орбита (Вращение)',
  cameraSpherical: 'Сферическая (трекбол)',
  cameraPlane: 'Плоскость (трекбол)',
  cameraProjection: 'Проекция',
  cameraPerspective: 'Перспективная',
  cameraOrthographic: 'Ортогональная',
  cameraFov: 'Угол обзора',
  cameraPivot: 'Выбор вращения',

  // file
  fileTitle: 'Файл',
  fileImportTitle: 'Импорт',
  fileAdd: 'Добавить(obj,sgl,ply,stl)',
  fileAutoMatrix: 'Масштаб-вид',
  fileVertexSRGB: 'Цвета вершин sRGB',
  fileExportSceneTitle: 'Экспорт сцены',
  fileExportAll: 'Экспорт все',
  fileExportSGL: 'Сохранить .sgl',
  fileExportOBJ: 'Сохранить .obj',
  fileExportPLY: 'Сохранить .ply',
  fileExportSTL: 'Сохранить .stl',

  fileExportTextureTitle: null,
  fileExportTextureSize: null,
  fileExportColor: null,
  fileExportRoughness: null,
  fileExportMetalness: null,

  // scene
  sceneTitle: 'Сцена',
  sceneReset: 'Очистить сцену',
  sceneResetConfirm: 'Подтвердить четкую сцену',
  sceneAddSphere: 'Добавить сферу',
  sceneAddCube: 'Добавить куб',
  sceneAddCylinder: 'Добавить цилиндр',
  sceneAddTorus: 'Добавить тор',
  sceneSelection: 'Выбрать',
  sceneMerge: 'Объединить',
  sceneDuplicate: null,
  sceneDelete: 'Удалить выделение',

  // mesh
  meshTitle: 'Сетка',
  meshNbVertices: 'Вершины : ',
  meshNbFaces: 'Грани : ',

  // topology
  topologyTitle: 'Топология',

  //multires
  multiresTitle: 'Детализация',
  multiresSubdivide: 'Увеличить',
  multiresReverse: 'Реверс',
  multiresResolution: 'Разрешение',
  multiresNoLower: 'Ниже уровня не существует.',
  multiresNoHigher: 'Выше уровня не существует.',
  multiresDelHigher: 'Удалить высокое',
  multiresDelLower: 'Удалить низкое',
  multiresSelectLowest: 'Выберете низкий перед реверсом.',
  multiresSelectHighest: 'Выберете бысокий перед увеличением.',
  multiresWarnBigMesh: function (nbFacesNext) {
    return 'Следующий уровень ' + nbFacesNext + ' faces.\n' +
      'Если вы уверены, снова нажмите на "разрешение".';
  },
  multiresNotReversible: 'К сожалению это не возможно, чтобы изменить эту сетку.\n' +
    'Сетка не продуктивна.',

  // remesh
  remeshTitle: 'Перестроить воксели',
  remeshRemesh: 'Перестроить',
  remeshResolution: 'Разрешение',
  remeshBlock: 'Блоки-кубики',

  // dynamic
  dynamicTitle: 'Динамическая топология',
  dynamicActivated: 'Активировать (без кубиков)',
  dynamicSubdivision: 'Увеличить',
  dynamicDecimation: 'Прореживание',
  dynamicLinear: 'Линейное увеличение',

  // sculpt
  sculptTitle: 'Лепить и красить',
  sculptBrush: '3D Кисть',
  sculptInflate: '3D Надуть',
  sculptTwist: '3D Закручивание',
  sculptSmooth: '3D Сгладить (-Shift)',
  sculptFlatten: '3D Расплющить',
  sculptPinch: '3D Сдавить',
  sculptCrease: '3D Складка',
  sculptDrag: '3D Тянучка',
  sculptMove: '3D Перемещать',
  sculptLocalScale: '3D масштабирование',
  sculptPaint: '2D Кисть',
  sculptMasking: '2D Маска (-Ctrl)',
  sculptTransform: 'Трансформация',

  sculptCommon: 'Общее',
  sculptTool: 'Инструмент',
  sculptSymmetry: 'Симетрия',
  sculptContinuous: 'Спрей',
  sculptRadius: 'Размер (-X)',
  sculptIntensity: 'Сила (-C)',
  sculptHardness: 'Жесткость',
  sculptCulling: 'Тонкая поверхность(передние вершины)',
  sculptAlphaTitle: 'Альфа',
  sculptLockPositon: 'Фиксация',
  sculptAlphaTex: 'Текстура',
  sculptImportAlpha: 'Импорт альфа текстуры (jpg, png...)',
  sculptNegative: 'Негатив (N или -Alt)',
  sculptColor: 'Палитра',
  sculptRoughness: 'Шероховатость',
  sculptMetallic: 'Металлический',
  sculptClay: 'Без учета содержимого',
  sculptAccumulate: 'Наращивать без ограничений',
  sculptColorGlobal: 'Глобальный',
  sculptPickColor: 'Пипетка материал (-S)',
  sculptTangentialSmoothing: 'Сглаживание по касательной',
  sculptTopologicalCheck: 'Проверка топологии',
  sculptMoveAlongNormal: 'Перемещать вдоль нормали',
  sculptMaskingClear: 'Очистить (-Ctrl + Drag)',
  sculptMaskingInvert: 'Инверсия (-Ctrl + Click)',
  sculptMaskingBlur: 'Сгладить',
  sculptMaskingSharpen: 'Резко',
  sculptPBRTitle: 'PBR материал',
  sculptPaintAll: 'Краска',
  sculptExtractTitle: 'Извлечь',
  sculptExtractThickness: 'Толщина',
  sculptExtractAction: 'Извлечь!',

  // states
  stateTitle: 'История',
  stateUndo: 'Назад',
  stateRedo: 'Вперед',
  stateMaxStack: 'Количество шагов',

  // pressure
  pressureTitle: 'Планшет pressure',
  pressureRadius: 'Нажим-размер',
  pressureIntensity: 'Нажим-жесткость',

  // rendering
  renderingTitle: 'Визуализация',
  renderingGrid: 'Показать сетку',
  renderingSymmetryLine: 'Линия симетрии',
  renderingMatcap: null,
  renderingCurvature: 'Рельефность',
  renderingPBR: 'PBR',
  renderingTransparency: 'Прозрачность',
  renderingNormal: 'Карта нормалей',
  renderingUV: 'UV',
  renderingShader: 'Шейдеры',
  renderingMaterial: 'Материал',
  renderingImportUV: 'Импорт (jpg, png...)',
  renderingImportMatcap: 'Импорт (jpg, png...)',
  renderingExtra: 'Дополнительно',
  renderingFlat: 'Плоскости',
  renderingWireframe: 'Каркас (W)',
  renderingExposure: 'Экспозиция',
  renderingEnvironment: 'Отражение',
  renderingIsolate: 'Изолировать / Показать (I)',
  renderingFilmic: 'Пленка',

  // contour
  contour: 'Контур',
  contourShow: 'Показать контур',
  contourColor: 'Цвет',
  darkenUnselected: 'Затемнить невыбранное',

  // pixel ratio
  resolution: 'Разрешение',

  // matcaps
  matcapPearl: 'Жемчуг',
  matcapClay: 'Глина',
  matcapSkin: 'Кожа',
  matcapGreen: 'Зеленый',
  matcapWhite: 'Белый',

  // sketchfab
  sketchfabTitle: 'В Sketchfab.com ',
  sketchfabUpload: 'Загрузить',
  sketchfabUploadMessage: 'Ведите API-ключ sketchfab.\n' +
    'Оставьте слово «guest», чтобы загрузить модель анонимно.\n' +
    '(По окончании загрузки и обработки откроется новое окно)',
  sketchfabUploadError: function (error) {
    return 'Ошибка загрузки в Sketchfab :\n' + error;
  },
  sketchfabUploadSuccess: 'Загрузка выполнена !\nВаша ссылка:',
  sketchfabAbort: 'Прервать загрузку?',
  sketchfabUploadProcessing: 'Обработка...\nВаша модель будет доступна после:',

  about: 'О программе',

  alphaNone: 'Нет',
  alphaSquare: 'Квадрат',
  alphaSkin: 'Кожа'
};

export default TR;
