define([], function () {

  'use strict';

  var TR = {
    // config
    configTitle: 'Конфигурация',

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
    cameraMode: null,
    cameraOrbit: 'Орбита (Вращение)',
    cameraSpherical: null,
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
    fileExportMeshTitle: 'Эксорт модели',
    fileExportSceneTitle: 'Экспорт сцены',
    fileExportSGL: 'Сохранить .sgl',
    fileExportOBJ: 'Сохранить .obj',
    fileExportPLY: 'Сохранить .ply',
    fileExportSTL: 'Сохранить .stl',
    fileReplayerTitle: 'Проиграть (BETA)',
    fileReplayerImport: 'Открыть .rep',
    fileReplayerExport: 'Сохранить .rep',
    fileReplayerUpload: 'Выгрузить(<10Mb).rep ',
    fileReplayerUploadStart: null,
    fileReplayerError: null,
    fileReplayerSuccess: null,
    fileReplayerAbort: null,

    // replayer
    replayTitle: 'Конфигурация',
    replayPaused: 'Пауза',
    replaySpeed: 'Скорость',
    replayOverride: 'Задать',

    // scene
    sceneTitle: 'Сцена',
    sceneReset: 'Очистить сцену',
    sceneAddSphere: 'Добавить сферу',
    sceneAddCube: 'Добавить куб',
    sceneSelection: 'Выбрать',
    sceneMerge: 'Объединить',

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
    sculptBrush: '3D Кисть (1)',
    sculptInflate: '3D Надуть (2)',
    sculptTwist: '3D Закручивание (3)',
    sculptSmooth: '3D Сгладить (4 or -Shift)',
    sculptFlatten: '3D Расплющить (5)',
    sculptPinch: '3D Сдавить (6)',
    sculptCrease: '3D Складка (7)',
    sculptDrag: '3D Тянучка (8)',
    sculptMove: '3D Перемещать (0)',
    sculptLocalScale: '3D масштабирование',
    sculptPaint: '2D Кисть (9)',
    sculptMasking: '2D Маска (-Ctrl)',
    sculptScale: 'Масштабирование xyz (G)',
    sculptTranslate: 'Перемещение xyz (E)',
    sculptRotate: 'Вращение xyz (R)',
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
    sculptPickColor: 'Пипетка материал',
    sculptTangentialSmoothing: null,
    sculptTopologicalCheck: null,
    sculptMoveAlongNormal: null,
    sculptMaskingClear: 'Очистить (-Ctrl + Drag)',
    sculptMaskingInvert: 'Инверсия (-Ctrl + Click)',
    sculptMaskingBlur: 'Сгладить',
    sculptMaskingSharpen: 'Резко',
    sculptDeleteSelection: 'Удалить выбранное ?',
    sculptPBRTitle: 'PBR материал',
    sculptPaintAll: 'Краска',
    sculptTranslateDepth: 'Перемещение в глубину (N or -Alt)',
    sculptRotateRoll: 'Фронтальное вращение (N или -Alt)',
    sculptExtractTitle: 'Извлечь',
    sculptExtractThickness: 'Толщина',
    sculptExtractAction: 'Извлечь !',

    // states
    stateTitle: 'История',
    stateUndo: 'Назад',
    stateRedo: 'Вперед',
    stateMaxStack: 'Количество шагов',

    // wacom
    wacomTitle: 'Планшет Wacom',
    wacomRadius: 'Нажим-размер',
    wacomIntensity: 'Нажим-жесткость',

    // rendering
    renderingTitle: 'Визуализация',
    renderingGrid: 'Показать сетку',
    renderingSymmetryLine: 'Линия симетрии',
    renderingMatcap: null,
    renderingCurvature: 'Рельефность',
    renderingPBR: 'PBR',
    renderingTransparency: 'Прозрачность',
    renderingNormal: 'Normal Map',
    renderingUV: 'UV',
    renderingShader: 'Шейдеры',
    renderingMaterial: 'Материал',
    renderingImportUV: 'Импорт (jpg, png...)',
    renderingExtra: 'Дополнительно',
    renderingFlat: 'Плоское-рельефное',
    renderingWireframe: 'Каркас',
    renderingExposure: 'Экспозиция',
    renderingEnvironment: 'Отражение',
    renderingIsolate: 'Изолировать / Показать (I)',

    // contour
    contour: 'Контур',
    contourShow: 'Показать контур',
    contourColor: 'Цвет',

    // matcaps
    matcapPearl: 'Жемчуг',
    matcapClay: 'Глина',
    matcapSkin: 'Кожа',
    matcapGreen: 'Зеленый',
    matcapWhite: 'Белый',
    matcapBronze: 'Бронза',
    matcapChavant: 'Пластелин',
    matcapDrink: 'Жидкость',
    matcapRedVelvet: 'Красный бархат',
    matcapOrange: 'Оранжевый',

    // sketchfab
    sketchfabTitle: 'В Sketchfab.com ',
    sketchfabUpload: 'Загрузить',
    sketchfabUploadMessage: 'Ведите ключ sketchfab API Key.\n' +
      'Вы также можете оставить «Гость», чтобы загрузить anonymously.\n' +
      '(Откроется новое окно, когда загрузка и обработка закончена)',
    sketchfabUploadError: function (error) {
      return 'Sketchfab ошибка загрузки :\n' + error;
    },
    sketchfabUploadSuccess: 'Загрузка выполнена !\nHere is your link :',
    sketchfabAbort: 'Прервать загрузку ?',
    sketchfabUploadProcessing: 'Загружается...\nВаша модель доступна :',

    donate: 'Помочь проекту !',

    alphaNone: 'Нет',
    alphaSquare: 'Квадрат',
    alphaSkin: 'Кожа',

    envFootPrint: 'Китайский театр Граумана',
    envGlazedPatio: 'Застекленный дворик',
    envNicolausChurch: 'Церковь Святого Николая',
    envTerrace: 'Терраса',
    envBryantPark: 'Бра́йант-парк'
  };

  // ui extra stuffs (yagui lib)
  // Extra: 'Настройка интерфейса',
  // Overall: 'Общие'
  // Advanced: 'Дополнительно';
  // Widget: 'Виджет',
  // Back: 'Фон',
  // Text: 'Текст',
  // Border: 'Бордюр',
  return TR;
});