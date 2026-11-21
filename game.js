const SUPABASE_URL = 'https://mzqgdpygxxddsfyjiaxk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7B-N_d0iNJJzT_0VfZxN_w_lBuo5zLD';

let db = null;
try {
  if (window.supabase && window.supabase.createClient) {
    db = window.supabase.createClient(SUPABASE_URL.trim(), SUPABASE_ANON_KEY.trim());
  }
} catch (e) {
  db = null;
}

const ROWS = 20;
const BLOCK = 30;
const SINGLE_COLS = 10;
const COOP_COLS = 20;
const BATTLE_COLS = 10;
const BATTLE_GAP = 20;
const BATTLE_TIME = 120;
const LINES_PER_LEVEL = 8;
const DROP_SPEED = 0.05;
const DEFAULT_SPEED = { start: 800, step: 55, min: 90 };
const FIRST_BOSS_SCORE = 10000;
const BOSS_SCORE_AFTER_WIN = 25000;
const BOSS_MAX_HP = 400;
const CELL_CHARS = { I: 'I', O: 'O', T: 'T', S: 'S', Z: 'Z', J: 'J', L: 'L', BOSS: 'B', RGB: 'R' };
const CHAR_CELLS = { I: 'I', O: 'O', T: 'T', S: 'S', Z: 'Z', J: 'J', L: 'L', B: 'BOSS', R: 'RGB' };
const P1_MAP = { KeyA: 'left', KeyD: 'right', KeyW: 'rotate', KeyS: 'down', Space: 'drop' };
const P2_MAP = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'rotate', ArrowDown: 'down', Enter: 'drop', NumpadEnter: 'drop' };
const SINGLE_EXTRA_DROP = { Numpad0: 'drop', Insert: 'drop' };

let speedSettings = { ...DEFAULT_SPEED };
let mode = 'single';
let boards = [];
let pieces = [null, null];
let drops = [null, null];
let next = [null, null];
let alive = [true, true];
let playerScores = [0, 0];
let score = 0;
let scores = [0, 0];
let lines = 0;
let level = 1;
let dropInterval = DEFAULT_SPEED.start;
let dropCounter = 0;
let lastTime = 0;
let gameOver = false;
let rafId = null;
let gameStarted = false;
let isPaused = false;
let isBossPaused = false;
let isBossActive = false;
let bossHP = BOSS_MAX_HP;
let bossScoreTarget = FIRST_BOSS_SCORE;
let isAdmin = false;
let cheatSquaresActive = false;
let secretShapeActive = false;
let secretCodeBuffer = '';
let particles = [];
let trailParticles = [];
let lineFlashes = [];
let hue = 0;
let shakeTime = 0;
let shakeDur = 1;
let shakePower = 0;
let pieceBag = [];
let bossBag = [];
let backgroundImage = null;
let uiOpacity = 75;
let useBgInBoard = true;
let leaderboardClicks = 0;
let heartClicks = 0;
let isEasterEggOpen = false;
let lbMode = 'single';
let battleTimer = BATTLE_TIME;
let battleEnded = false;
let battleWinner = -1;
let matchNicks = ['Игрок 1', 'Игрок 2'];
let selectedLocalMode = 'coop';
let selectedOnlineMode = 'coop';
let myId = Math.random().toString(36).slice(2, 10);
let myRole = null;
let roomCode = '';
let channel = null;
let partnerConnected = false;
let partnerNick = '';
let lastNetSend = 0;
let lastStateAt = 0;
let netLost = false;
let scoreSubmitted = false;

const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nctx = nextCanvas.getContext('2d');
const nextCanvas2 = document.getElementById('next2');
const nctx2 = nextCanvas2.getContext('2d');
const nextTitle1 = document.getElementById('next-title-1');
const nextBlock2 = document.getElementById('next-block-2');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const speedEl = document.getElementById('speed');
const restartBtn = document.getElementById('restart');
const pauseBtn = document.getElementById('pause-btn');
const menuBtn = document.getElementById('menu-btn');
const settingsToggle = document.getElementById('settings-toggle');
const mpExitBtn = document.getElementById('mp-exit');
const bossHud = document.getElementById('boss-hud');
const bossHudFill = document.getElementById('boss-hud-fill');
const bossHudText = document.getElementById('boss-hud-text');
const battleHud = document.getElementById('battle-hud');
const bhName0 = document.getElementById('bh-name-0');
const bhName1 = document.getElementById('bh-name-1');
const bhScore0 = document.getElementById('bh-score-0');
const bhScore1 = document.getElementById('bh-score-1');
const bhTimer = document.getElementById('bh-timer');
const bossModal = document.getElementById('boss-modal');
const btnStartBoss = document.getElementById('btn-start-boss');
const bossWait = document.getElementById('boss-wait');
const adminPanel = document.getElementById('admin-panel');
const adminTargetNick = document.getElementById('admin-target-nick');
const adminSetScore = document.getElementById('admin-set-score');
const adminNewNick = document.getElementById('admin-new-nick');
const nickInput = document.getElementById('player-nick');
const leaderboardList = document.getElementById('leaderboard-list');
const mainMenu = document.getElementById('main-menu');
const menuNick = document.getElementById('menu-nick');
const btnPlay = document.getElementById('btn-play');
const btnMultiplayer = document.getElementById('btn-multiplayer');
const themePresetsBox = document.getElementById('theme-presets');
const gameContainer = document.querySelector('.game-container');
const modeText = document.getElementById('mode-text');
const modeDot = document.getElementById('mode-dot');
const modeRoom = document.getElementById('mode-room');
const mpLegend = document.getElementById('mp-legend');
const legend1 = document.getElementById('legend-1');
const legend2 = document.getElementById('legend-2');
const legendScore1 = document.getElementById('legend-score-1');
const legendScore2 = document.getElementById('legend-score-2');
const singlePad = document.getElementById('mobile-controls');
const mpPads = document.getElementById('mp-mobile');
const pad1 = document.getElementById('mp-pad-1');
const pad2 = document.getElementById('mp-pad-2');
const mpModal = document.getElementById('mp-modal');
const mpClose = document.getElementById('mp-close');
const mpTabLocal = document.getElementById('mp-tab-local');
const mpTabOnline = document.getElementById('mp-tab-online');
const mpPaneLocal = document.getElementById('mp-pane-local');
const mpPaneOnline = document.getElementById('mp-pane-online');
const mpStartLocal = document.getElementById('mp-start-local');
const localModeCoop = document.getElementById('local-mode-coop');
const localModeBattle = document.getElementById('local-mode-battle');
const onlineModeCoop = document.getElementById('online-mode-coop');
const onlineModeBattle = document.getElementById('online-mode-battle');
const localNick1 = document.getElementById('local-nick-1');
const localNick2 = document.getElementById('local-nick-2');
const mpCreate = document.getElementById('mp-create');
const mpJoin = document.getElementById('mp-join');
const mpCodeInput = document.getElementById('mp-code-input');
const mpOnlineSetup = document.getElementById('mp-online-setup');
const mpRoomBox = document.getElementById('mp-room');
const mpCodeEl = document.getElementById('mp-code');
const mpCopyCode = document.getElementById('mp-copy-code');
const mpCopyLink = document.getElementById('mp-copy-link');
const mpRoster = document.getElementById('mp-roster');
const mpStartOnline = document.getElementById('mp-start-online');
const mpLeave = document.getElementById('mp-leave');
const mpStatus = document.getElementById('mp-status');
const lbTabSingle = document.getElementById('lb-tab-single');
const lbTabCoop = document.getElementById('lb-tab-coop');
const lbTabBattle = document.getElementById('lb-tab-battle');
const toastsBox = document.getElementById('toasts');

const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]]
};

const CHEAT_SHAPES = {
  BLOCK_2x5: [[1, 1], [1, 1], [1, 1], [1, 1], [1, 1]],
  SECRET: [
    [0, 0, 1, 1, 0, 0], [0, 0, 1, 1, 0, 0], [0, 0, 1, 1, 0, 0], [0, 0, 1, 1, 0, 0],
    [0, 0, 1, 1, 0, 0], [0, 0, 1, 1, 0, 0], [1, 1, 0, 0, 1, 1], [1, 1, 0, 0, 1, 1]
  ]
};

const BOSS_SHAPES = {
  PLUS: [[0, 1, 0], [1, 1, 1], [0, 1, 0]],
  DOT: [[1]],
  O_PIMPLE: [[1, 1], [1, 1], [1, 0]],
  O_PIMPLE_MIRROR: [[1, 1], [1, 1], [0, 1]],
  P_SHAPE: [[1, 1, 1], [1, 0, 0], [1, 0, 0]],
  LINE_3: [[1, 1, 1]],
  LINE_4: [[1, 1, 1, 1]],
  T_SHAPE: [[1, 1, 1], [0, 1, 0], [0, 1, 0]],
  SMALL_G: [[1, 0], [1, 1]]
};

const DEFAULT_PIECE_COLORS = {
  I: '#4ecdc4', O: '#ffe66d', T: '#c44dff', S: '#4dff88',
  Z: '#ff4d6d', J: '#4d7cff', L: '#ffa94d', BOSS: '#e94560', RGB: '#ff00ff'
};

const THEME_PRESETS = [
  { name: 'Космос', ui: { page: '#1a1a2e', container: '#16213e', panel: '#0f3460', inner: '#0f0f1e', accent: '#4ecdc4', accent2: '#ff2e88' } },
  { name: 'Тьма', ui: { page: '#000000', container: '#111111', panel: '#222222', inner: '#000000', accent: '#e94560', accent2: '#ffb02e' } },
  { name: 'Неон', ui: { page: '#0d0221', container: '#0f084b', panel: '#261447', inner: '#000000', accent: '#ff00ff', accent2: '#00e5ff' } },
  { name: 'Лес', ui: { page: '#1e3a2b', container: '#2a4b3a', panel: '#3b5e4b', inner: '#0f1f15', accent: '#7bed9f', accent2: '#ffd166' } }
];

const DEFAULT_UI_COLORS = {
  page: { label: 'Фон сайта', value: THEME_PRESETS[0].ui.page },
  container: { label: 'Контейнер', value: THEME_PRESETS[0].ui.container },
  panel: { label: 'Панели', value: THEME_PRESETS[0].ui.panel },
  inner: { label: 'Поле', value: THEME_PRESETS[0].ui.inner },
  accent: { label: 'Акцент 1', value: THEME_PRESETS[0].ui.accent },
  accent2: { label: 'Акцент 2', value: THEME_PRESETS[0].ui.accent2 }
};

let PIECE_COLORS = { ...DEFAULT_PIECE_COLORS };
let UI_COLORS = {};
Object.keys(DEFAULT_UI_COLORS).forEach(k => UI_COLORS[k] = DEFAULT_UI_COLORS[k].value);

function isBattle() { return mode.startsWith('battle'); }
function isCoop() { return mode.startsWith('coop'); }
function isOnline() { return mode.endsWith('host') || mode.endsWith('guest'); }
function isGuest() { return mode.endsWith('guest'); }
function isMulti() { return mode !== 'single'; }
function ownerColor(i) { return i === 0 ? UI_COLORS.accent : UI_COLORS.accent2; }
function createBoard(width) { return Array.from({ length: ROWS }, () => Array(width).fill(null)); }
function boardIndexOf(i) { return isBattle() ? i : 0; }
function boardFor(i) { return boards[boardIndexOf(i)]; }
function boardPixelOffset(i) { return isBattle() ? (i === 0 ? 0 : BATTLE_COLS * BLOCK + BATTLE_GAP) : 0; }

function toast(msg, kind) {
  const el = document.createElement('div');
  el.className = 'toast' + (kind ? ' ' + kind : '');
  el.textContent = msg;
  toastsBox.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 320);
  }, 2600);
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function getNick() {
  return (nickInput.value || menuNick.value || 'Игрок').trim() || 'Игрок';
}

function hexToRgba(hex, alpha) {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const UI_PANEL_SELECTOR = '.game-container, .menu-content, .mp-content, .panel, .leaderboard-panel, .settings, .boss-content, .boss-bar, .battle-hud, .mode-chip, .legend-card, .mp-pad, .toast, .lb-tabs';
const UI_INNER_SELECTOR = '.leader-item, .color-item, .mp-card, .mp-code-box, .roster-row, .mp-tabs, .mp-mode-row, .legend-score, input[type="text"], input[type="number"], #next, #next2, .mob-btn, .lb-tab';

function applyUIColors() {
  const root = document.documentElement;
  root.style.setProperty('--bg-page', UI_COLORS.page);
  root.style.setProperty('--bg-container', UI_COLORS.container);
  root.style.setProperty('--bg-panel', UI_COLORS.panel);
  root.style.setProperty('--bg-inner', UI_COLORS.inner);
  root.style.setProperty('--accent', UI_COLORS.accent);
  root.style.setProperty('--accent2', UI_COLORS.accent2);
  root.style.setProperty('--p1', UI_COLORS.accent);
  root.style.setProperty('--p2', UI_COLORS.accent2);
  applyUiOpacity(uiOpacity);
  draw();
  drawNext();
}

function applyUiOpacity(val) {
  uiOpacity = val;
  if (!backgroundImage) return;
  const percent = val / 100;
  const panelColor = hexToRgba(UI_COLORS.panel, percent);
  const containerColor = hexToRgba(UI_COLORS.container, percent);
  document.querySelectorAll(UI_PANEL_SELECTOR).forEach(el => el.style.setProperty('background-color', panelColor, 'important'));
  document.querySelectorAll(UI_INNER_SELECTOR).forEach(el => el.style.setProperty('background-color', containerColor, 'important'));
  gameContainer.style.setProperty('background-color', containerColor, 'important');
}

function saveSettings() {
  try {
    localStorage.setItem('tetris-piece-colors', JSON.stringify(PIECE_COLORS));
    localStorage.setItem('tetris-ui-colors', JSON.stringify(UI_COLORS));
    localStorage.setItem('tetris-speed', JSON.stringify(speedSettings));
    localStorage.setItem('tetris-ui-opacity', uiOpacity);
    localStorage.setItem('tetris-use-bg-in-board', useBgInBoard);
    if (backgroundImage && backgroundImage.src) localStorage.setItem('tetris-bg', backgroundImage.src);
    else localStorage.removeItem('tetris-bg');
  } catch (e) {}
}

function loadSettings() {
  try {
    const pieceRaw = localStorage.getItem('tetris-piece-colors');
    if (pieceRaw) PIECE_COLORS = { ...DEFAULT_PIECE_COLORS, ...JSON.parse(pieceRaw) };
    const uiRaw = localStorage.getItem('tetris-ui-colors');
    if (uiRaw) UI_COLORS = { ...UI_COLORS, ...JSON.parse(uiRaw) };
    if (!UI_COLORS.accent2) UI_COLORS.accent2 = DEFAULT_UI_COLORS.accent2.value;
    const speedRaw = localStorage.getItem('tetris-speed');
    if (speedRaw) speedSettings = { ...DEFAULT_SPEED, ...JSON.parse(speedRaw) };
    const opRaw = localStorage.getItem('tetris-ui-opacity');
    if (opRaw) {
      uiOpacity = parseInt(opRaw) || 75;
      document.getElementById('set-ui-opacity').value = uiOpacity;
      document.getElementById('val-ui-opacity').textContent = uiOpacity;
    }
    const bgUse = localStorage.getItem('tetris-use-bg-in-board');
    if (bgUse !== null) {
      useBgInBoard = bgUse === 'true';
      document.getElementById('use-bg-in-board').checked = useBgInBoard;
    }
    const bgRaw = localStorage.getItem('tetris-bg');
    if (bgRaw) {
      const img = new Image();
      img.onload = () => {
        backgroundImage = img;
        applyBackgroundToUI(img.src);
        updateBgStatus();
        draw();
      };
      img.onerror = () => localStorage.removeItem('tetris-bg');
      img.src = bgRaw;
    }
    const savedNick = localStorage.getItem('tetris-nick');
    if (savedNick) {
      menuNick.value = savedNick;
      nickInput.value = savedNick;
      checkAdmin(savedNick);
    }
  } catch (e) {}
}

function applyBackgroundToUI(src) {
  if (src) {
    document.body.style.backgroundImage = `url(${src})`;
    document.body.classList.add('has-bg');
    applyUiOpacity(uiOpacity);
  } else {
    document.body.style.backgroundImage = 'none';
    document.body.classList.remove('has-bg');
    document.querySelectorAll(UI_PANEL_SELECTOR + ', ' + UI_INNER_SELECTOR).forEach(el => el.style.removeProperty('background-color'));
  }
}

function updateBgStatus() {
  document.getElementById('bg-status').textContent = backgroundImage ? '✅ Фото загружено' : 'Фон не задан';
}

function buildThemePresets() {
  themePresetsBox.innerHTML = '';
  THEME_PRESETS.forEach((theme, index) => {
    const btn = document.createElement('div');
    btn.className = 'theme-btn' + (index === 0 ? ' active' : '');
    btn.title = theme.name;
    btn.tabIndex = 0;
    btn.setAttribute('role', 'button');
    btn.style.backgroundColor = theme.ui.panel;
    btn.style.borderBottom = '6px solid ' + theme.ui.accent;
    btn.style.borderRight = '6px solid ' + theme.ui.accent2;
    const activate = () => {
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      Object.keys(theme.ui).forEach(key => UI_COLORS[key] = theme.ui[key]);
      applyUIColors();
      buildUIColorsPanel();
      saveSettings();
    };
    btn.addEventListener('click', activate);
    btn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
    });
    themePresetsBox.appendChild(btn);
  });
}

function buildColorsPanel() {
  const box = document.getElementById('colors-panel');
  box.innerHTML = '';
  Object.keys(DEFAULT_PIECE_COLORS).filter(k => k !== 'BOSS' && k !== 'RGB').forEach(type => {
    const item = document.createElement('div');
    item.className = 'color-item';
    const input = document.createElement('input');
    input.type = 'color';
    input.value = PIECE_COLORS[type];
    input.addEventListener('input', () => {
      PIECE_COLORS[type] = input.value;
      saveSettings();
      draw();
      drawNext();
    });
    const label = document.createElement('span');
    label.textContent = type;
    item.appendChild(input);
    item.appendChild(label);
    box.appendChild(item);
  });
}

function buildUIColorsPanel() {
  const box = document.getElementById('ui-colors-panel');
  box.innerHTML = '';
  Object.keys(DEFAULT_UI_COLORS).forEach(key => {
    const item = document.createElement('div');
    item.className = 'color-item';
    const input = document.createElement('input');
    input.type = 'color';
    input.value = UI_COLORS[key];
    input.addEventListener('input', () => {
      UI_COLORS[key] = input.value;
      applyUIColors();
      saveSettings();
    });
    const label = document.createElement('span');
    label.textContent = DEFAULT_UI_COLORS[key].label;
    item.appendChild(input);
    item.appendChild(label);
    box.appendChild(item);
  });
  if (backgroundImage) applyUiOpacity(uiOpacity);
}

const setStartSpeed = document.getElementById('set-start-speed');
const setSpeedStep = document.getElementById('set-speed-step');
const setMinSpeed = document.getElementById('set-min-speed');
const valStart = document.getElementById('val-start');
const valStep = document.getElementById('val-step');
const valMin = document.getElementById('val-min');
const setUiOpacity = document.getElementById('set-ui-opacity');
const valUiOpacity = document.getElementById('val-ui-opacity');
const useBgInBoardCb = document.getElementById('use-bg-in-board');

function updateSpeedUI() {
  setStartSpeed.value = speedSettings.start;
  setSpeedStep.value = speedSettings.step;
  setMinSpeed.value = speedSettings.min;
  valStart.textContent = speedSettings.start;
  valStep.textContent = speedSettings.step;
  valMin.textContent = speedSettings.min;
}

function speedChanged() {
  if (gameStarted && !gameOver && !isGuest()) {
    dropInterval = recalcSpeed();
    updateUI();
  }
  saveSettings();
}

setStartSpeed.addEventListener('input', () => { speedSettings.start = parseInt(setStartSpeed.value); valStart.textContent = speedSettings.start; speedChanged(); });
setSpeedStep.addEventListener('input', () => { speedSettings.step = parseInt(setSpeedStep.value); valStep.textContent = speedSettings.step; speedChanged(); });
setMinSpeed.addEventListener('input', () => { speedSettings.min = parseInt(setMinSpeed.value); valMin.textContent = speedSettings.min; speedChanged(); });

setUiOpacity.addEventListener('input', () => {
  const val = parseInt(setUiOpacity.value);
  valUiOpacity.textContent = val;
  applyUiOpacity(val);
  saveSettings();
});

useBgInBoardCb.addEventListener('change', () => {
  useBgInBoard = useBgInBoardCb.checked;
  saveSettings();
  draw();
});

document.getElementById('bg-upload').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      backgroundImage = img;
      applyBackgroundToUI(img.src);
      updateBgStatus();
      saveSettings();
      draw();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
  e.target.value = '';
});

document.getElementById('bg-reset').addEventListener('click', () => {
  backgroundImage = null;
  applyBackgroundToUI(null);
  updateBgStatus();
  saveSettings();
  draw();
});

document.getElementById('settings-reset').addEventListener('click', () => {
  if (!confirm('Сбросить все настройки?')) return;
  PIECE_COLORS = { ...DEFAULT_PIECE_COLORS };
  Object.keys(DEFAULT_UI_COLORS).forEach(k => UI_COLORS[k] = DEFAULT_UI_COLORS[k].value);
  speedSettings = { ...DEFAULT_SPEED };
  uiOpacity = 75;
  useBgInBoard = true;
  setUiOpacity.value = 75;
  valUiOpacity.textContent = 75;
  useBgInBoardCb.checked = true;
  backgroundImage = null;
  applyBackgroundToUI(null);
  applyUIColors();
  updateBgStatus();
  buildColorsPanel();
  buildUIColorsPanel();
  updateSpeedUI();
  saveSettings();
  if (gameStarted && !isGuest()) reset();
});

settingsToggle.addEventListener('click', () => {
  gameContainer.classList.toggle('settings-hidden');
  settingsToggle.blur();
  fitBoard();
});

function formatDate(s) {
  try {
    return new Date(s).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch (e) {
    return '';
  }
}

function setLbMode(m) {
  lbMode = m;
  lbTabSingle.classList.toggle('active', m === 'single');
  lbTabCoop.classList.toggle('active', m === 'coop');
  lbTabBattle.classList.toggle('active', m === 'battle');
  fetchLeaderboard();
}

lbTabSingle.addEventListener('click', () => setLbMode('single'));
lbTabCoop.addEventListener('click', () => setLbMode('coop'));
lbTabBattle.addEventListener('click', () => setLbMode('battle'));

async function fetchLeaderboard() {
  leaderboardList.innerHTML = '<div class="leader-empty">Загрузка...</div>';
  if (!db) {
    leaderboardList.innerHTML = '<div class="leader-empty">Лидерборд недоступен оффлайн</div>';
    return;
  }
  try {
    if (lbMode === 'single') {
      const { data, error } = await db.from('leaderboard').select('name, score').order('score', { ascending: false }).limit(20);
      if (error) throw error;
      renderSingleLB(data);
    } else if (lbMode === 'coop') {
      const { data, error } = await db.from('coop_leaderboard').select('nick1, nick2, score, played_at').order('score', { ascending: false }).limit(20);
      if (error) throw error;
      renderCoopLB(data);
    } else {
      const { data, error } = await db.from('battle_leaderboard').select('winner_name, loser_name, winner_score, loser_score, played_at').order('winner_score', { ascending: false }).limit(20);
      if (error) throw error;
      renderBattleLB(data);
    }
    if (backgroundImage) applyUiOpacity(uiOpacity);
  } catch (err) {
    leaderboardList.innerHTML = `<div class="leader-empty" style="color:#e94560">Ошибка: ${escapeHTML(err.message || 'Нет связи')}</div>`;
  }
}

function renderSingleLB(data) {
  if (!data || !data.length) {
    leaderboardList.innerHTML = '<div class="leader-empty">Пока пусто</div>';
    return;
  }
  leaderboardList.innerHTML = '';
  data.forEach((e, i) => {
    const div = document.createElement('div');
    div.className = 'leader-item';
    div.innerHTML = `<span class="leader-rank">${i + 1}.</span><span class="leader-name">${escapeHTML(e.name)}</span><span class="leader-score">${Number(e.score) || 0}</span>`;
    leaderboardList.appendChild(div);
  });
}

function renderCoopLB(data) {
  if (!data || !data.length) {
    leaderboardList.innerHTML = '<div class="leader-empty">Пока пусто</div>';
    return;
  }
  leaderboardList.innerHTML = '';
  data.forEach((e, i) => {
    const div = document.createElement('div');
    div.className = 'leader-item';
    div.innerHTML = `<span class="leader-rank">${i + 1}.</span><span class="leader-name">${escapeHTML(e.nick1)} + ${escapeHTML(e.nick2)}</span><span class="leader-score">${Number(e.score) || 0}</span><span class="leader-date">${formatDate(e.played_at)}</span>`;
    leaderboardList.appendChild(div);
  });
}

function renderBattleLB(data) {
  if (!data || !data.length) {
    leaderboardList.innerHTML = '<div class="leader-empty">Пока пусто</div>';
    return;
  }
  leaderboardList.innerHTML = '';
  data.forEach((e, i) => {
    const div = document.createElement('div');
    div.className = 'leader-item';
    div.innerHTML = `<span class="leader-rank">${i + 1}.</span><span class="leader-name">${escapeHTML(e.winner_name)} <span class="leader-vs">${e.winner_score}:${e.loser_score}</span> ${escapeHTML(e.loser_name)}</span><span class="leader-date">${formatDate(e.played_at)}</span>`;
    leaderboardList.appendChild(div);
  });
}

async function addScoreToLeaderboard(finalScore) {
  if (finalScore <= 0 || !db) return;
  try {
    const name = getNick();
    const { data } = await db.from('leaderboard').select('score').eq('name', name).maybeSingle();
    if (data) {
      if (finalScore > data.score) await db.from('leaderboard').update({ score: finalScore }).eq('name', name);
    } else {
      await db.from('leaderboard').insert({ name, score: finalScore });
    }
    if (lbMode === 'single') fetchLeaderboard();
  } catch (e) {}
}

async function submitCoop(finalScore) {
  if (!db) return;
  try {
    await db.from('coop_leaderboard').insert({ nick1: matchNicks[0], nick2: matchNicks[1], score: finalScore });
    if (lbMode === 'coop') fetchLeaderboard();
  } catch (e) {}
}

async function submitBattle() {
  if (!db) return;
  try {
    const w = battleWinner >= 0 ? battleWinner : (scores[0] >= scores[1] ? 0 : 1);
    await db.from('battle_leaderboard').insert({
      winner_name: matchNicks[w],
      loser_name: matchNicks[1 - w],
      winner_score: scores[w],
      loser_score: scores[1 - w]
    });
    if (lbMode === 'battle') fetchLeaderboard();
  } catch (e) {}
}

function checkAdmin(nick) {
  isAdmin = nick === 'ADM1N';
  updateModeUI();
}

document.getElementById('easter-egg-trigger').addEventListener('click', () => {
  if (isEasterEggOpen) {
    isEasterEggOpen = false;
    leaderboardClicks = 0;
    heartClicks = 0;
    document.getElementById('credits-panel').classList.add('hidden');
    document.getElementById('final-credit').classList.add('hidden');
    return;
  }
  if (leaderboardClicks < 13) leaderboardClicks++;
  if (leaderboardClicks === 13) {
    isEasterEggOpen = true;
    document.getElementById('credits-panel').classList.remove('hidden');
  }
});

document.getElementById('heart-trigger').addEventListener('click', () => {
  if (!isEasterEggOpen) return;
  if (heartClicks < 6) heartClicks++;
  if (heartClicks === 6) document.getElementById('final-credit').classList.remove('hidden');
});

document.getElementById('admin-clear').addEventListener('click', () => {
  if (!isAdmin || isGuest() || isBattle()) return;
  boards[0] = createBoard(boards[0][0].length);
  score += 100;
  updateUI();
  draw();
  sendState(true);
});

document.getElementById('admin-squares').addEventListener('click', () => {
  if (!isAdmin || isGuest()) return;
  cheatSquaresActive = !cheatSquaresActive;
  document.getElementById('admin-squares').textContent = cheatSquaresActive ? 'Выключить читы' : 'Включить фигуру 2x5';
});

document.getElementById('admin-apply-score').addEventListener('click', async () => {
  if (!isAdmin) return;
  if (!db) return toast('Лидерборд недоступен оффлайн', 'bad');
  const target = adminTargetNick.value.trim();
  const value = parseInt(adminSetScore.value);
  if (!target || isNaN(value)) return toast('Введи ник и очки', 'bad');
  try {
    const { data } = await db.from('leaderboard').select('score').eq('name', target).maybeSingle();
    if (data) await db.from('leaderboard').update({ score: value }).eq('name', target);
    else await db.from('leaderboard').insert({ name: target, score: value });
    fetchLeaderboard();
    toast(`Очки ${value} выданы игроку ${target}`, 'good');
  } catch (e) {
    toast('Ошибка связи с базой', 'bad');
  }
});

document.getElementById('admin-apply-nick').addEventListener('click', async () => {
  if (!isAdmin) return;
  if (!db) return toast('Лидерборд недоступен оффлайн', 'bad');
  const target = adminTargetNick.value.trim();
  const newNick = adminNewNick.value.trim();
  if (!target || !newNick) return toast('Введи старый и новый ник', 'bad');
  try {
    await db.from('leaderboard').update({ name: newNick }).eq('name', target);
    fetchLeaderboard();
    toast(`Ник ${target} изменён на ${newNick}`, 'good');
  } catch (e) {
    toast('Ошибка связи с базой', 'bad');
  }
});

nickInput.addEventListener('input', () => {
  localStorage.setItem('tetris-nick', nickInput.value.trim());
  if (menuNick.value !== nickInput.value) menuNick.value = nickInput.value;
  checkAdmin(nickInput.value.trim());
  if (channel) channel.track({ id: myId, role: myRole, nick: getNick(), ts: Date.now() });
});

menuNick.addEventListener('input', () => {
  localStorage.setItem('tetris-nick', menuNick.value.trim());
  if (nickInput.value !== menuNick.value) nickInput.value = menuNick.value;
});

menuNick.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); btnPlay.click(); }
});

function applyLayout() {
  if (isBattle()) {
    boards = [createBoard(BATTLE_COLS), createBoard(BATTLE_COLS)];
    canvas.width = BATTLE_COLS * BLOCK * 2 + BATTLE_GAP;
  } else if (isCoop()) {
    boards = [createBoard(COOP_COLS)];
    canvas.width = COOP_COLS * BLOCK;
  } else {
    boards = [createBoard(SINGLE_COLS)];
    canvas.width = SINGLE_COLS * BLOCK;
  }
  canvas.height = ROWS * BLOCK;
  fitBoard();
}

function fitBoard() {
  const aspect = canvas.width / canvas.height;
  const narrow = window.matchMedia('(max-width: 1024px), (pointer: coarse)').matches;
  const settingsVisible = !narrow && !gameContainer.classList.contains('settings-hidden');
  const chrome = narrow ? 24 : 510 + (settingsVisible ? 240 : 0);
  const availW = Math.max(200, window.innerWidth - chrome);
  const maxH = narrow ? Math.max(240, window.innerHeight * 0.52) : Math.min(640, window.innerHeight - 150);
  const w = Math.min(availW, maxH * aspect);
  const h = w / aspect;
  canvas.style.width = Math.floor(w) + 'px';
  canvas.style.height = Math.floor(h) + 'px';
  const padWidth = Math.floor(w) + 'px';
  singlePad.style.maxWidth = padWidth;
  mpPads.style.maxWidth = padWidth;
  bossHud.style.maxWidth = padWidth;
  battleHud.style.maxWidth = padWidth;
  mpLegend.style.maxWidth = padWidth;
}

window.addEventListener('resize', fitBoard);

function playerActive(i) {
  if (mode === 'single') return i === 0;
  if (mode === 'coop-local' || mode === 'battle-local') return true;
  if (mode === 'coop-host' || mode === 'battle-host') return i === 0 ? true : partnerConnected;
  return true;
}

function canPlay(i) {
  return playerActive(i) && alive[i];
}

function drawFromBag(bag, keys) {
  if (!bag.length) {
    const fresh = [...keys];
    for (let i = fresh.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fresh[i], fresh[j]] = [fresh[j], fresh[i]];
    }
    bag.push(...fresh);
  }
  return bag.pop();
}

function spawnX(i, width) {
  if (isCoop()) {
    const base = i * (COOP_COLS / 2);
    return Math.max(0, Math.min(COOP_COLS - width, base + Math.floor((COOP_COLS / 2 - width) / 2)));
  }
  return Math.floor((SINGLE_COLS - width) / 2);
}

function newPiece(i) {
  let type;
  let matrix;
  if (!isBattle() && cheatSquaresActive) {
    type = 'RGB';
    matrix = CHEAT_SHAPES.BLOCK_2x5.map(r => [...r]);
  } else if (!isBattle() && secretShapeActive) {
    secretShapeActive = false;
    type = 'O';
    matrix = CHEAT_SHAPES.SECRET.map(r => [...r]);
  } else if (!isBattle() && isBossActive) {
    const key = drawFromBag(bossBag, Object.keys(BOSS_SHAPES));
    type = 'BOSS';
    matrix = BOSS_SHAPES[key].map(r => [...r]);
  } else {
    const key = drawFromBag(pieceBag, Object.keys(SHAPES));
    type = key;
    matrix = SHAPES[key].map(r => [...r]);
  }
  return { type, matrix, x: spawnX(i, matrix[0].length), y: 0, owner: i };
}

function rotate(matrix) {
  const n = matrix.length;
  const m = matrix[0].length;
  const res = Array.from({ length: m }, () => Array(n).fill(0));
  for (let y = 0; y < n; y++) for (let x = 0; x < m; x++) res[x][n - 1 - y] = matrix[y][x];
  return res;
}

function cellBlocked(px, py, owner) {
  const b = boardFor(owner);
  const w = b[0].length;
  if (px < 0 || px >= w || py >= ROWS) return true;
  if (py >= 0 && b[py][px]) return true;
  return false;
}

function collide(piece) {
  for (let y = 0; y < piece.matrix.length; y++) {
    for (let x = 0; x < piece.matrix[y].length; x++) {
      if (!piece.matrix[y][x]) continue;
      if (cellBlocked(piece.x + x, piece.y + y, piece.owner)) return true;
    }
  }
  return false;
}

function ghostY(i) {
  const p = pieces[i];
  let y = p.y;
  const probe = { type: p.type, matrix: p.matrix, x: p.x, y, owner: i };
  while (true) {
    probe.y = y + 1;
    if (collide(probe)) break;
    y++;
  }
  return y;
}

function merge(target, piece) {
  piece.matrix.forEach((row, y) => row.forEach((v, x) => {
    const py = piece.y + y;
    const px = piece.x + x;
    if (v && py >= 0 && py < ROWS && px >= 0 && px < target[0].length) target[py][px] = piece.type;
  }));
}

function overlapsBoardCells(piece) {
  const b = boardFor(piece.owner);
  for (let y = 0; y < piece.matrix.length; y++) {
    for (let x = 0; x < piece.matrix[y].length; x++) {
      if (!piece.matrix[y][x]) continue;
      const py = piece.y + y;
      const px = piece.x + x;
      if (py >= 0 && py < ROWS && px >= 0 && px < b[0].length && b[py][px]) return true;
    }
  }
  return false;
}

function settleOverlaps() {
  for (let pass = 0; pass < 2; pass++) {
    let changed = false;
    for (let i = 0; i < 2; i++) {
      const p = pieces[i];
      if (!p || !canPlay(i)) continue;
      if (!overlapsBoardCells(p)) continue;
      const origY = p.y;
      let escaped = false;
      for (let up = 1; up <= 6; up++) {
        p.y = origY - up;
        if (!overlapsBoardCells(p)) { escaped = true; break; }
      }
      if (escaped) continue;
      p.y = origY;
      merge(boardFor(i), p);
      pieces[i] = null;
      clearLines(boardIndexOf(i), i);
      spawnPiece(i);
      changed = true;
    }
    if (!changed) break;
  }
}

function endGame() {
  if (gameOver) return;
  gameOver = true;
  addShake(6, 320);
  if (!isGuest() && !scoreSubmitted) {
    scoreSubmitted = true;
    if (mode === 'single') addScoreToLeaderboard(score);
    else if (isCoop()) submitCoop(score);
  }
  sendState(true);
  updateModeUI();
}

function endBattle(forcedWinner) {
  if (battleEnded) return;
  battleEnded = true;
  gameOver = true;
  battleWinner = (forcedWinner === 0 || forcedWinner === 1) ? forcedWinner : (scores[0] === scores[1] ? -1 : (scores[0] > scores[1] ? 0 : 1));
  addShake(6, 320);
  if (!isGuest() && !scoreSubmitted) {
    scoreSubmitted = true;
    submitBattle();
  }
  updateBattleHud();
  sendState(true);
  updateModeUI();
}

function killPlayer(i) {
  if (isBattle()) {
    endBattle(1 - i);
    return;
  }
  if (!alive[i]) return;
  alive[i] = false;
  pieces[i] = null;
  drops[i] = null;
  next[i] = null;
  addShake(6, 300);
  const othersAlive = [0, 1].some(j => j !== i && playerActive(j) && alive[j]);
  if (othersAlive) toast(`Игрок ${i + 1} выбыл! Игра продолжается`, 'bad');
  else endGame();
  updateModeUI();
  drawNext();
  sendState(true);
}

function spawnPiece(i) {
  if (!canPlay(i)) {
    pieces[i] = null;
    next[i] = null;
    return;
  }
  const p = next[i] || newPiece(i);
  p.x = spawnX(i, p.matrix[0].length);
  p.y = 0;
  p.owner = i;
  pieces[i] = p;
  next[i] = newPiece(i);
  if (collide(p)) {
    pieces[i] = null;
    killPlayer(i);
    return;
  }
  drawNext();
}

function lockPiece(i) {
  const p = pieces[i];
  if (!p) return;
  merge(boardFor(i), p);
  pieces[i] = null;
  settleOverlaps();
  clearLines(boardIndexOf(i), i);
  spawnPiece(i);
}

function stepGravity() {
  const landed = [];
  for (let i = 0; i < 2; i++) {
    if (!canPlay(i) || !pieces[i]) continue;
    const p = pieces[i];
    p.y++;
    if (collide(p)) {
      p.y--;
      landed.push(i);
    }
  }
  if (!landed.length) return;
  landed.forEach(i => {
    merge(boardFor(i), pieces[i]);
    pieces[i] = null;
  });
  settleOverlaps();
  landed.forEach(i => {
    if (canPlay(i)) clearLines(boardIndexOf(i), i);
  });
  landed.forEach(i => spawnPiece(i));
}

function hardDrop(i) {
  if (!canPlay(i) || drops[i] || !pieces[i]) return;
  const p = pieces[i];
  const finalY = ghostY(i);
  if (p.type === 'RGB' || finalY <= p.y) {
    const landed = { type: p.type, matrix: p.matrix, x: p.x, y: finalY, owner: i };
    createParticles(landed);
    addShake(5, 170);
    merge(boardFor(i), landed);
    pieces[i] = null;
    sendFx({ t: 'land', p: { t: landed.type, m: landed.matrix, x: landed.x, y: landed.y }, bi: boardIndexOf(i), o: i });
    settleOverlaps();
    clearLines(boardIndexOf(i), i);
    spawnPiece(i);
    dropCounter = 0;
    return;
  }
  drops[i] = { type: p.type, matrix: p.matrix, x: p.x, y: p.y, startY: p.y, animOffset: 0, owner: i };
  pieces[i] = null;
  spawnPiece(i);
  dropCounter = 0;
}

function finishDrop(i, d) {
  const landed = { type: d.type, matrix: d.matrix, x: d.x, y: d.y, owner: i };
  createParticles(landed);
  addShake(5, 170);
  merge(boardFor(i), landed);
  drops[i] = null;
  sendFx({ t: 'land', p: { t: landed.type, m: landed.matrix, x: landed.x, y: landed.y }, bi: boardIndexOf(i), o: i });
  settleOverlaps();
  clearLines(boardIndexOf(i), i);
  dropCounter = 0;
}

function updateDrops(delta) {
  for (let i = 0; i < 2; i++) {
    const d = drops[i];
    if (!d) continue;
    d.animOffset += delta * DROP_SPEED;
    createTrailParticles(d);
    let landed = false;
    while (true) {
      const probe = { type: d.type, matrix: d.matrix, x: d.x, y: d.y + 1, owner: i };
      if (collide(probe)) {
        landed = true;
        break;
      }
      if (d.animOffset < 1) break;
      d.y++;
      d.animOffset -= 1;
    }
    if (landed) {
      d.animOffset = 0;
      finishDrop(i, d);
    }
  }
}

function applyAction(i, action) {
  if (!canPlay(i)) return;
  if (action === 'drop') {
    hardDrop(i);
    return;
  }
  const p = pieces[i];
  if (!p) return;
  if (action === 'left' || action === 'right') {
    const dx = action === 'left' ? -1 : 1;
    p.x += dx;
    if (collide(p)) p.x -= dx;
  } else if (action === 'rotate') {
    const old = p.matrix;
    const oldX = p.x;
    p.matrix = rotate(p.matrix);
    for (const kick of [0, -1, 1, -2, 2]) {
      p.x = oldX + kick;
      if (!collide(p)) return;
    }
    p.matrix = old;
    p.x = oldX;
  } else if (action === 'down') {
    p.y++;
    if (collide(p)) {
      p.y--;
      lockPiece(i);
    }
    dropCounter = 0;
  }
}

function doInput(target, action) {
  if (!gameStarted || gameOver || isPaused || isBossPaused) return;
  if (isGuest()) {
    if (target !== 1) return;
    guestPredict(action);
    sendInput(action);
    return;
  }
  applyAction(target, action);
  if (isOnline()) sendState(true);
}

function guestPredict(action) {
  const p = pieces[1];
  if (!p) return;
  if (action === 'left' || action === 'right') {
    const dx = action === 'left' ? -1 : 1;
    p.x += dx;
    if (collide(p)) p.x -= dx;
  } else if (action === 'rotate') {
    const old = p.matrix;
    const oldX = p.x;
    p.matrix = rotate(p.matrix);
    for (const kick of [0, -1, 1, -2, 2]) {
      p.x = oldX + kick;
      if (!collide(p)) return;
    }
    p.matrix = old;
    p.x = oldX;
  }
}

function updateBossUI() {
  const percent = Math.max(0, (bossHP / BOSS_MAX_HP) * 100);
  bossHudFill.style.width = percent + '%';
  bossHudText.textContent = `${Math.max(0, bossHP)} / ${BOSS_MAX_HP}`;
}

function syncBossModal() {
  const show = isBossActive && isBossPaused && !isBattle();
  bossModal.classList.toggle('hidden', !show);
  btnStartBoss.classList.toggle('hidden', isGuest());
  bossWait.classList.toggle('hidden', !isGuest());
  bossHud.classList.toggle('hidden', !isBossActive || isBattle());
}

function checkForBoss() {
  if (isBattle()) return;
  if (!isBossActive && !isBossPaused && score >= bossScoreTarget) triggerBoss();
}

function triggerBoss() {
  isBossActive = true;
  isBossPaused = true;
  bossHP = BOSS_MAX_HP;
  updateBossUI();
  syncBossModal();
  addShake(7, 350);
  sendFx({ t: 'boss' });
  sendState(true);
}

function startBossFight() {
  if (isGuest() || isBattle()) return;
  bossHP = BOSS_MAX_HP;
  isBossActive = true;
  isBossPaused = false;
  bossBag = [];
  boards[0] = createBoard(boards[0][0].length);
  particles = [];
  trailParticles = [];
  lineFlashes = [];
  drops = [null, null];
  pieces = [null, null];
  next = [null, null];
  for (let i = 0; i < 2; i++) {
    if (canPlay(i)) {
      next[i] = newPiece(i);
      spawnPiece(i);
    }
  }
  dropInterval = recalcSpeed();
  dropCounter = 0;
  updateBossUI();
  syncBossModal();
  updateUI();
  drawNext();
  draw();
  sendState(true);
}

function replaceBossPieces() {
  for (let i = 0; i < 2; i++) {
    if (drops[i] && drops[i].type === 'BOSS') {
      createParticles(drops[i]);
      drops[i] = null;
    }
    if (pieces[i] && pieces[i].type === 'BOSS') pieces[i] = newPiece(i);
    if (next[i] && next[i].type === 'BOSS') next[i] = newPiece(i);
  }
  drawNext();
}

function createLineExplosion(rowIndex, rowTypes, bi) {
  const offX = boardPixelOffset(bi);
  rowTypes.forEach((type, x) => {
    if (!type) return;
    const color = type === 'RGB' ? `hsl(${hue}, 100%, 50%)` : (PIECE_COLORS[type] || PIECE_COLORS.BOSS);
    const cx = offX + x * BLOCK + BLOCK / 2;
    const cy = rowIndex * BLOCK + BLOCK / 2;
    for (let i = 0; i < 4; i++) {
      particles.push({
        x: cx + (Math.random() - 0.5) * BLOCK,
        y: cy + (Math.random() - 0.5) * BLOCK,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 5 - 1.5,
        size: BLOCK * (0.3 + Math.random() * 0.25),
        color,
        life: 1
      });
    }
  });
  lineFlashes.push({ y: rowIndex, bi, life: 1 });
  if (particles.length > 900) particles.splice(0, particles.length - 900);
}

function clearLines(bi, trigger) {
  const b = boards[bi];
  let cleared = 0;
  const rowsFx = [];
  for (let y = ROWS - 1; y >= 0; y--) {
    if (b[y].every(c => c)) {
      const types = b[y].slice();
      createLineExplosion(y, types, bi);
      rowsFx.push({ y, c: types.map(t => CELL_CHARS[t] || 'B').join('') });
      b.splice(y, 1);
      b.unshift(Array(b[0].length).fill(null));
      cleared++;
      y++;
    }
  }
  if (!cleared) return;
  const gained = [0, 100, 300, 500, 800][cleared] * level;
  if (isBattle()) {
    scores[bi] += gained;
  } else {
    score += gained;
    const owner = (trigger === 0 || trigger === 1) ? trigger : 0;
    playerScores[owner] += gained;
  }
  lines += cleared;
  addShake(2 + cleared * 1.5, 200);
  sendFx({ t: 'clear', rows: rowsFx, s: 2 + cleared * 1.5, bi });
  if (!isBattle()) {
    if (isBossActive) {
      bossHP -= cleared * 15;
      updateBossUI();
      if (bossHP <= 0) {
        isBossActive = false;
        bossScoreTarget = score + BOSS_SCORE_AFTER_WIN;
        boards[0] = createBoard(boards[0][0].length);
        dropCounter = 0;
        addShake(9, 450);
        sendFx({ t: 'win' });
        syncBossModal();
        replaceBossPieces();
        toast('👹 Боссик повержен! Поле очищено, фигуры снова обычные', 'good');
      }
    } else {
      checkForBoss();
    }
  }
  const newLevel = Math.floor(lines / LINES_PER_LEVEL) + 1;
  if (newLevel !== level) level = newLevel;
  dropInterval = recalcSpeed();
  updateUI();
  updateBattleHud();
}

function recalcSpeed() {
  const progress = (lines % LINES_PER_LEVEL) / LINES_PER_LEVEL;
  const target = Math.max(speedSettings.min, speedSettings.start - (level - 1) * speedSettings.step);
  return Math.max(speedSettings.min, target * (1 - progress * 0.25));
}

function updateUI() {
  if (isBattle()) scoreEl.textContent = scores[0] + ' : ' + scores[1];
  else scoreEl.textContent = score;
  linesEl.textContent = lines;
  levelEl.textContent = level;
  const pct = Math.round((speedSettings.start / (dropInterval || speedSettings.start)) * 100);
  speedEl.textContent = pct + '%';
  legendScore1.textContent = playerScores[0];
  legendScore2.textContent = playerScores[1];
}

function updatePauseBtn() {
  pauseBtn.textContent = isPaused ? 'Продолжить' : 'Пауза';
}

function updateBattleHud() {
  bhName0.textContent = matchNicks[0];
  bhName1.textContent = matchNicks[1];
  bhScore0.textContent = scores[0];
  bhScore1.textContent = scores[1];
  const t = Math.max(0, Math.ceil(battleTimer));
  const m = Math.floor(t / 60);
  const s = t % 60;
  bhTimer.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function addShake(power, dur = 180) {
  if (reducedMotion) return;
  const left = shakeTime > 0 ? shakePower * (shakeTime / shakeDur) : 0;
  shakePower = Math.max(left, power);
  shakeDur = dur;
  shakeTime = dur;
}

function updateShake(delta) {
  if (shakeTime <= 0) return;
  shakeTime -= delta;
  if (shakeTime <= 0) {
    shakeTime = 0;
    gameContainer.style.transform = '';
    return;
  }
  const k = shakeTime / shakeDur;
  const p = shakePower * k * k;
  gameContainer.style.transform = `translate(${((Math.random() * 2 - 1) * p).toFixed(2)}px, ${((Math.random() * 2 - 1) * p).toFixed(2)}px)`;
}

function createParticles(piece) {
  const base = PIECE_COLORS[piece.type] || PIECE_COLORS.BOSS;
  const offX = boardPixelOffset(piece.owner);
  piece.matrix.forEach((row, y) => row.forEach((v, x) => {
    if (!v) return;
    const cx = offX + (piece.x + x) * BLOCK + BLOCK / 2;
    const cy = (piece.y + y) * BLOCK + BLOCK / 2;
    for (let i = 0; i < 3; i++) {
      particles.push({
        x: cx + (Math.random() - 0.5) * BLOCK,
        y: cy + (Math.random() - 0.5) * BLOCK,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 4 - 2,
        size: BLOCK * 0.4,
        color: piece.type === 'RGB' ? `hsl(${hue}, 100%, 50%)` : base,
        life: 1
      });
    }
  }));
}

function createTrailParticles(piece) {
  const base = PIECE_COLORS[piece.type] || PIECE_COLORS.BOSS;
  const offX = boardPixelOffset(piece.owner);
  piece.matrix.forEach((row, y) => row.forEach((v, x) => {
    if (!v) return;
    trailParticles.push({
      x: offX + (piece.x + x) * BLOCK + Math.random() * BLOCK,
      y: (piece.y + y + (piece.animOffset || 0)) * BLOCK,
      vx: (Math.random() - 0.5) * 1.5,
      vy: Math.random() * 2 + 1,
      size: Math.random() * 6 + 2,
      color: piece.type === 'RGB' ? `hsl(${hue}, 100%, 50%)` : base,
      life: 1
    });
  }));
  if (trailParticles.length > 500) trailParticles.splice(0, trailParticles.length - 500);
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.3;
    p.size -= 0.6;
    p.life -= 0.03;
    if (p.life <= 0 || p.size <= 0) particles.splice(i, 1);
  }
  for (let i = trailParticles.length - 1; i >= 0; i--) {
    const p = trailParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.05;
    if (p.life <= 0) trailParticles.splice(i, 1);
  }
  for (let i = lineFlashes.length - 1; i >= 0; i--) {
    lineFlashes[i].life -= 0.07;
    if (lineFlashes[i].life <= 0) lineFlashes.splice(i, 1);
  }
}

function drawBlock(c, x, y, color, size = BLOCK) {
  c.save();
  c.fillStyle = color;
  c.fillRect(x * size, y * size, size, size);
  c.strokeStyle = '#000';
  c.lineWidth = 2;
  c.strokeRect(x * size + 1, y * size + 1, size - 2, size - 2);
  c.fillStyle = 'rgba(255,255,255,0.8)';
  c.fillRect(x * size + 2, y * size + 2, size - 8, 2);
  c.fillRect(x * size + 2, y * size + 2, 2, size - 8);
  c.fillStyle = 'rgba(0,0,0,0.4)';
  c.fillRect(x * size + 6, y * size + size - 4, size - 8, 2);
  c.fillRect(x * size + size - 4, y * size + 6, 2, size - 8);
  c.restore();
}

function drawGhostBlock(c, px, py, color) {
  c.save();
  c.globalAlpha = 0.22;
  c.fillStyle = color;
  c.fillRect(px, py, BLOCK, BLOCK);
  c.globalAlpha = 0.85;
  c.strokeStyle = color;
  c.lineWidth = 2;
  c.strokeRect(px + 1, py + 1, BLOCK - 2, BLOCK - 2);
  c.restore();
}

function drawOwnerOutline(px, py, color) {
  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 3.5, py + 3.5, BLOCK - 7, BLOCK - 7);
  ctx.restore();
}

function pieceColor(piece) {
  return piece.type === 'RGB' ? `hsl(${hue}, 100%, 50%)` : (PIECE_COLORS[piece.type] || PIECE_COLORS.BOSS);
}

function drawBoardFrame(bi, offX) {
  const w = boards[bi][0].length * BLOCK;
  const h = ROWS * BLOCK;
  ctx.strokeStyle = 'rgba(255,255,255,0.055)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= boards[bi][0].length; x++) {
    ctx.beginPath();
    ctx.moveTo(offX + x * BLOCK, 0);
    ctx.lineTo(offX + x * BLOCK, h);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(offX, y * BLOCK);
    ctx.lineTo(offX + w, y * BLOCK);
    ctx.stroke();
  }
  ctx.save();
  ctx.strokeStyle = isBattle() ? ownerColor(bi) : UI_COLORS.accent;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 2;
  ctx.strokeRect(offX + 1, 1, w - 2, h - 2);
  ctx.restore();
}

function drawBoardCells(board, offX) {
  board.forEach((row, y) => row.forEach((type, x) => {
    if (!type) return;
    const color = type === 'RGB' ? `hsl(${hue}, 100%, 50%)` : (PIECE_COLORS[type] || PIECE_COLORS.BOSS);
    ctx.save();
    ctx.translate(offX, 0);
    drawBlock(ctx, x, y, color);
    ctx.restore();
  }));
}

function draw() {
  if (!boards.length) return;
  if (backgroundImage && useBgInBoard) {
    const imgRatio = backgroundImage.width / backgroundImage.height;
    const canvasRatio = canvas.width / canvas.height;
    let sx = 0, sy = 0, sw = backgroundImage.width, sh = backgroundImage.height;
    if (imgRatio > canvasRatio) {
      sw = backgroundImage.height * canvasRatio;
      sx = (backgroundImage.width - sw) / 2;
    } else {
      sh = backgroundImage.width / canvasRatio;
      sy = (backgroundImage.height - sh) / 2;
    }
    ctx.drawImage(backgroundImage, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(10, 10, 24, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = UI_COLORS.inner;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const boardCount = isBattle() ? 2 : 1;
  for (let bi = 0; bi < boardCount; bi++) {
    drawBoardFrame(bi, boardPixelOffset(bi));
    drawBoardCells(boards[bi], boardPixelOffset(bi));
  }

  if (isBattle()) {
    const midX = BATTLE_COLS * BLOCK + BATTLE_GAP / 2;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.setLineDash([6, 8]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(midX, 0);
    ctx.lineTo(midX, canvas.height);
    ctx.stroke();
    ctx.restore();
  }

  if (isBossActive && !isBattle()) {
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    ctx.lineWidth = 1;
  }

  lineFlashes.forEach(f => {
    const offX = boardPixelOffset(f.bi);
    const w = boards[f.bi][0].length * BLOCK;
    ctx.save();
    ctx.globalAlpha = f.life * 0.7;
    ctx.fillStyle = '#fff';
    ctx.fillRect(offX, f.y * BLOCK, w, BLOCK);
    ctx.globalAlpha = f.life;
    ctx.fillStyle = UI_COLORS.accent;
    ctx.fillRect(offX, f.y * BLOCK, w, 3);
    ctx.fillRect(offX, f.y * BLOCK + BLOCK - 3, w, 3);
    ctx.restore();
  });

  for (let i = 0; i < 2; i++) {
    const d = drops[i];
    if (!d) continue;
    const offX = boardPixelOffset(i);
    const color = pieceColor(d);
    d.matrix.forEach((row, y) => row.forEach((v, x) => {
      if (!v) return;
      const curY = d.y + y + (d.animOffset || 0);
      const fromY = d.startY + y;
      if (curY > fromY) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        const grad = ctx.createLinearGradient(0, fromY * BLOCK, 0, curY * BLOCK);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, color);
        ctx.fillStyle = grad;
        ctx.fillRect(offX + (d.x + x) * BLOCK, fromY * BLOCK, BLOCK, (curY - fromY) * BLOCK);
        ctx.restore();
      }
      ctx.save();
      ctx.globalAlpha = 0.88;
      ctx.translate(offX, 0);
      drawBlock(ctx, d.x + x, curY, color);
      ctx.restore();
      if (isMulti()) drawOwnerOutline(offX + (d.x + x) * BLOCK, curY * BLOCK, ownerColor(i));
    }));
  }

  if (!gameOver) {
    for (let i = 0; i < 2; i++) {
      const p = pieces[i];
      if (!p) continue;
      const offX = boardPixelOffset(i);
      const owner = ownerColor(i);
      const color = pieceColor(p);
      const gy = ghostY(i);
      if (gy > p.y) {
        p.matrix.forEach((row, y) => row.forEach((v, x) => {
          if (v) drawGhostBlock(ctx, offX + (p.x + x) * BLOCK, (gy + y) * BLOCK, mode === 'single' ? color : owner);
        }));
      }
      p.matrix.forEach((row, y) => row.forEach((v, x) => {
        if (!v) return;
        ctx.save();
        ctx.translate(offX, 0);
        drawBlock(ctx, p.x + x, p.y + y, color);
        ctx.restore();
        if (isMulti()) drawOwnerOutline(offX + (p.x + x) * BLOCK, (p.y + y) * BLOCK, owner);
      }));
    }
  }

  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    const half = p.size / 2;
    ctx.fillRect(p.x - half, p.y - half, p.size, p.size);
    if (p.size > 4) {
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x - half, p.y - half, p.size, p.size);
    }
    ctx.restore();
  });

  trailParticles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    ctx.restore();
  });

  ctx.textAlign = 'center';
  if (gameOver) {
    ctx.fillStyle = 'rgba(4,4,12,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (isBattle()) {
      ctx.fillStyle = battleWinner === -1 ? UI_COLORS.accent : ownerColor(battleWinner);
      ctx.font = 'bold 38px "Segoe UI", sans-serif';
      ctx.fillText(battleWinner === -1 ? 'НИЧЬЯ' : 'ПОБЕДА: ' + matchNicks[battleWinner], canvas.width / 2, canvas.height / 2 - 24);
      ctx.fillStyle = '#dbe4ef';
      ctx.font = 'bold 24px "Segoe UI", sans-serif';
      ctx.fillText(scores[0] + ' : ' + scores[1], canvas.width / 2, canvas.height / 2 + 12);
      ctx.fillStyle = '#93a3b8';
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillText(isGuest() ? 'Хост может начать заново' : 'Нажми «Заново» чтобы сыграть ещё', canvas.width / 2, canvas.height / 2 + 44);
    } else {
      ctx.fillStyle = UI_COLORS.accent2;
      ctx.font = 'bold 40px "Segoe UI", sans-serif';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 10);
      ctx.fillStyle = '#dbe4ef';
      ctx.font = 'bold 20px "Segoe UI", sans-serif';
      ctx.fillText('Счёт: ' + score, canvas.width / 2, canvas.height / 2 + 24);
      if (isCoop()) {
        ctx.fillStyle = ownerColor(0);
        ctx.font = 'bold 15px "Segoe UI", sans-serif';
        ctx.fillText(matchNicks[0] + ': ' + playerScores[0], canvas.width / 2 - 110, canvas.height / 2 + 50);
        ctx.fillStyle = ownerColor(1);
        ctx.fillText(matchNicks[1] + ': ' + playerScores[1], canvas.width / 2 + 110, canvas.height / 2 + 50);
      }
      ctx.fillStyle = '#93a3b8';
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillText(isGuest() ? 'Хост может начать заново' : 'Нажми «Заново» чтобы сыграть ещё', canvas.width / 2, canvas.height / 2 + 74);
    }
  } else if (isGuest() && netLost) {
    ctx.fillStyle = 'rgba(4,4,12,0.82)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffe66d';
    ctx.font = 'bold 26px "Segoe UI", sans-serif';
    ctx.fillText('СВЯЗЬ С ХОСТОМ ПОТЕРЯНА', canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = '#93a3b8';
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillText('Проверь интернет или выйди из лобби', canvas.width / 2, canvas.height / 2 + 28);
  } else if (isPaused) {
    ctx.fillStyle = 'rgba(8,8,20,0.82)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = UI_COLORS.accent;
    ctx.font = 'bold 40px "Segoe UI", sans-serif';
    ctx.fillText('ПАУЗА', canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = '#93a3b8';
    ctx.font = '15px "Segoe UI", sans-serif';
    const hint = (isOnline() && !isGuest() && !partnerConnected) ? 'Игрок 2 отключился — играешь один' : 'Нажми «Продолжить» чтобы вернуться';
    ctx.fillText(hint, canvas.width / 2, canvas.height / 2 + 30);
  }
}

function drawNextOne(cnv, c, piece, owner) {
  c.fillStyle = UI_COLORS.inner;
  c.fillRect(0, 0, cnv.width, cnv.height);
  if (isMulti()) {
    c.save();
    c.globalAlpha = 0.6;
    c.strokeStyle = owner;
    c.lineWidth = 2;
    c.strokeRect(1, 1, cnv.width - 2, cnv.height - 2);
    c.restore();
  }
  if (!piece) return;
  const m = piece.matrix;
  const size = Math.min(24, Math.floor((cnv.width - 14) / m[0].length), Math.floor((cnv.height - 14) / m.length));
  const offX = (cnv.width - m[0].length * size) / 2;
  const offY = (cnv.height - m.length * size) / 2;
  c.save();
  c.translate(offX, offY);
  const color = piece.type === 'RGB' ? `hsl(${hue}, 100%, 50%)` : (PIECE_COLORS[piece.type] || PIECE_COLORS.BOSS);
  m.forEach((row, y) => row.forEach((v, x) => {
    if (v) drawBlock(c, x, y, color, size);
  }));
  c.restore();
}

function drawNext() {
  drawNextOne(nextCanvas, nctx, next[0], ownerColor(0));
  if (isMulti()) drawNextOne(nextCanvas2, nctx2, next[1], ownerColor(1));
}

function updateModeUI() {
  const coop = isCoop();
  const battle = isBattle();
  const multi = isMulti();
  const online = isOnline();
  gameContainer.classList.toggle('coop', coop);
  mpLegend.classList.toggle('hidden', !multi);
  nextBlock2.classList.toggle('hidden', !multi);
  nextTitle1.textContent = multi ? 'Игрок 1' : 'Следующая';
  mpExitBtn.classList.toggle('hidden', !online);
  singlePad.classList.toggle('hidden', multi);
  mpPads.classList.toggle('hidden', !multi);
  pad1.classList.toggle('hidden', isGuest());
  pad2.classList.toggle('hidden', online && !isGuest());
  adminPanel.classList.toggle('hidden', !(isAdmin && !isGuest() && !isBattle()));
  restartBtn.disabled = isGuest();
  pauseBtn.disabled = isGuest();
  legend1.classList.toggle('me', !isGuest());
  legend2.classList.toggle('me', multi);
  legend1.classList.toggle('dead', multi && !alive[0]);
  legend2.classList.toggle('dead', multi && !alive[1]);
  battleHud.classList.toggle('hidden', !battle);
  bossHud.classList.toggle('hidden', !isBossActive || battle);
  if (mode === 'single') modeText.textContent = 'Одиночная игра';
  else if (mode === 'coop-local') modeText.textContent = 'Кооп · локально';
  else if (mode === 'battle-local') modeText.textContent = '1 на 1 · локально';
  else if (mode === 'coop-host') modeText.textContent = 'Кооп · онлайн · хост';
  else if (mode === 'coop-guest') modeText.textContent = 'Кооп · онлайн · гость';
  else if (mode === 'battle-host') modeText.textContent = '1 на 1 · онлайн · хост';
  else modeText.textContent = '1 на 1 · онлайн · гость';
  modeRoom.classList.toggle('hidden', !online);
  modeRoom.textContent = online ? roomCode : '';
  modeDot.className = 'dot ' + (online ? (netLost || !partnerConnected ? 'bad' : 'good') : 'local');
  updateUI();
  drawNext();
  fitBoard();
}

function togglePause() {
  if (!gameStarted || gameOver || isGuest()) return;
  isPaused = !isPaused;
  updatePauseBtn();
  sendState(true);
  draw();
}

pauseBtn.addEventListener('click', () => {
  togglePause();
  pauseBtn.blur();
});

restartBtn.addEventListener('click', () => {
  restartBtn.blur();
  if (!gameStarted || isGuest()) return;
  reset();
  if (isOnline()) broadcastStart();
});

menuBtn.addEventListener('click', () => {
  menuBtn.blur();
  exitToMenu();
});

btnStartBoss.addEventListener('click', () => {
  btnStartBoss.blur();
  startBossFight();
});

function reset() {
  score = 0;
  scores = [0, 0];
  playerScores = [0, 0];
  alive = [true, true];
  lines = 0;
  level = 1;
  dropInterval = speedSettings.start;
  dropCounter = 0;
  gameOver = false;
  scoreSubmitted = false;
  particles = [];
  trailParticles = [];
  lineFlashes = [];
  pieces = [null, null];
  drops = [null, null];
  next = [null, null];
  pieceBag = [];
  bossBag = [];
  secretShapeActive = false;
  secretCodeBuffer = '';
  bossScoreTarget = FIRST_BOSS_SCORE;
  bossHP = BOSS_MAX_HP;
  isBossActive = false;
  isBossPaused = false;
  isPaused = false;
  battleTimer = BATTLE_TIME;
  battleEnded = false;
  battleWinner = -1;
  shakeTime = 0;
  gameContainer.style.transform = '';
  applyLayout();
  for (let i = 0; i < 2; i++) {
    if (canPlay(i)) {
      next[i] = newPiece(i);
      spawnPiece(i);
    }
  }
  updateUI();
  updatePauseBtn();
  updateBossUI();
  syncBossModal();
  updateModeUI();
  updateBattleHud();
  draw();
  startLoop();
}

function startLoop() {
  if (rafId) cancelAnimationFrame(rafId);
  lastTime = performance.now();
  rafId = requestAnimationFrame(update);
}

function update(time = 0) {
  if (!gameStarted) {
    rafId = null;
    return;
  }
  const delta = Math.min(Math.max(time - lastTime, 0), 100);
  lastTime = time;
  updateShake(delta);
  updateParticles();

  if (isGuest()) {
    if (performance.now() - lastStateAt > 4000 && !netLost) {
      netLost = true;
      updateModeUI();
    }
    for (let i = 0; i < 2; i++) {
      const d = drops[i];
      if (!d) continue;
      d.animOffset += delta * DROP_SPEED;
      createTrailParticles(d);
      while (d.animOffset >= 1) {
        const probe = { type: d.type, matrix: d.matrix, x: d.x, y: d.y + 1, owner: i };
        if (collide(probe)) {
          d.animOffset = 0;
          break;
        }
        d.y++;
        d.animOffset -= 1;
      }
    }
    hue = (hue + 2) % 360;
    draw();
    rafId = requestAnimationFrame(update);
    return;
  }

  if (isOnline()) sendState(false);

  if (gameOver || isPaused || isBossPaused) {
    draw();
    rafId = requestAnimationFrame(update);
    return;
  }

  hue = (hue + 2) % 360;
  if (isBattle() && !battleEnded) {
    battleTimer -= delta / 1000;
    if (battleTimer <= 0) {
      battleTimer = 0;
      endBattle();
    }
    updateBattleHud();
  }
  updateDrops(delta);
  dropCounter += delta;
  if (dropCounter > dropInterval) {
    dropCounter = 0;
    stepGravity();
  }
  draw();
  rafId = requestAnimationFrame(update);
}

function startMode(newMode) {
  mode = newMode;
  applyLayout();
  gameContainer.classList.toggle('settings-hidden', newMode !== 'single');
  mainMenu.classList.add('hidden');
  mpModal.classList.add('hidden');
  gameStarted = true;
  netLost = false;
  setLbMode(isBattle() ? 'battle' : (isCoop() ? 'coop' : 'single'));
  reset();
}

btnPlay.addEventListener('click', () => {
  const nick = menuNick.value.trim() || 'Игрок';
  nickInput.value = nick;
  localStorage.setItem('tetris-nick', nick);
  checkAdmin(nick);
  btnPlay.blur();
  startMode('single');
});

btnMultiplayer.addEventListener('click', () => {
  btnMultiplayer.blur();
  const nick = menuNick.value.trim() || 'Игрок';
  nickInput.value = nick;
  localStorage.setItem('tetris-nick', nick);
  checkAdmin(nick);
  mpModal.classList.remove('hidden');
  updateLobbyUI();
});

mpClose.addEventListener('click', () => {
  if (channel) leaveRoom();
  mpModal.classList.add('hidden');
});

mpTabLocal.addEventListener('click', () => {
  mpTabLocal.classList.add('active');
  mpTabOnline.classList.remove('active');
  mpPaneLocal.classList.remove('hidden');
  mpPaneOnline.classList.add('hidden');
});

mpTabOnline.addEventListener('click', () => {
  mpTabOnline.classList.add('active');
  mpTabLocal.classList.remove('active');
  mpPaneOnline.classList.remove('hidden');
  mpPaneLocal.classList.add('hidden');
  if (!db) setMpStatus('Онлайн недоступен: нет подключения к серверу. Играйте локально.', 'bad');
});

localModeCoop.addEventListener('click', () => {
  selectedLocalMode = 'coop';
  localModeCoop.classList.add('active');
  localModeBattle.classList.remove('active');
});

localModeBattle.addEventListener('click', () => {
  selectedLocalMode = 'battle';
  localModeBattle.classList.add('active');
  localModeCoop.classList.remove('active');
});

onlineModeCoop.addEventListener('click', () => {
  if (myRole !== 'host') return;
  selectedOnlineMode = 'coop';
  onlineModeCoop.classList.add('active');
  onlineModeBattle.classList.remove('active');
});

onlineModeBattle.addEventListener('click', () => {
  if (myRole !== 'host') return;
  selectedOnlineMode = 'battle';
  onlineModeBattle.classList.add('active');
  onlineModeCoop.classList.remove('active');
});

mpStartLocal.addEventListener('click', () => {
  mpStartLocal.blur();
  if (channel) leaveRoom();
  const n1 = localNick1.value.trim() || 'Игрок 1';
  const n2 = localNick2.value.trim() || 'Игрок 2';
  matchNicks = [n1, n2];
  startMode(selectedLocalMode === 'battle' ? 'battle-local' : 'coop-local');
  toast(selectedLocalMode === 'battle' ? 'Битва 1 на 1 началась!' : 'Кооп начался!', 'good');
});

function setMpStatus(text, kind) {
  mpStatus.textContent = text;
  mpStatus.className = 'mp-status' + (kind ? ' ' + kind : '');
}

function makeCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 4; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function rosterRow(role, name, color, connected) {
  return `<div class="roster-row${connected ? '' : ' waiting'}" style="border-left-color:${color}">
    <span class="roster-role">${escapeHTML(role)}</span>
    <span class="roster-name">${escapeHTML(name)}</span>
    <span class="roster-state">${connected ? 'в сети' : 'ожидание…'}</span>
  </div>`;
}

function updateLobbyUI() {
  mpCodeEl.textContent = roomCode || '----';
  mpOnlineSetup.classList.toggle('hidden', !!roomCode);
  mpRoomBox.classList.toggle('hidden', !roomCode);
  const isHost = myRole === 'host';
  onlineModeCoop.disabled = !isHost;
  onlineModeBattle.disabled = !isHost;
  if (!roomCode) {
    mpRoster.innerHTML = '';
    return;
  }
  const meColor = isHost ? ownerColor(0) : ownerColor(1);
  const otherColor = isHost ? ownerColor(1) : ownerColor(0);
  const meRole = isHost ? 'Хост · Игрок 1' : 'Гость · Игрок 2';
  const otherRole = isHost ? 'Гость · Игрок 2' : 'Хост · Игрок 1';
  mpRoster.innerHTML =
    rosterRow(meRole, getNick() + ' (вы)', meColor, true) +
    rosterRow(otherRole, partnerConnected ? (partnerNick || 'Игрок') : 'Ждём игрока…', otherColor, partnerConnected);
  mpStartOnline.disabled = !(isHost && partnerConnected);
  mpStartOnline.textContent = isHost
    ? (partnerConnected ? '▶ Начать игру' : 'Ждём игрока 2…')
    : 'Ждём старта хоста…';
  if (backgroundImage) applyUiOpacity(uiOpacity);
}

function joinChannel() {
  return new Promise(resolve => {
    try {
      channel = db.realtime.channel('ttrizz-' + roomCode, {
        config: { broadcast: { self: false }, presence: { key: myId } }
      });
      channel.on('presence', { event: 'sync' }, handlePresenceSync);
      channel.on('broadcast', { event: 'state' }, ({ payload }) => {
        if (myRole === 'guest') applyNetState(payload);
      });
      channel.on('broadcast', { event: 'fx' }, ({ payload }) => {
        if (myRole === 'guest') applyNetFx(payload);
      });
      channel.on('broadcast', { event: 'input' }, ({ payload }) => {
        if (myRole === 'host' && payload && payload.from !== myId) {
          if (gameStarted && !gameOver && !isPaused && !isBossPaused) applyAction(1, payload.a);
          sendState(true);
        }
      });
      channel.on('broadcast', { event: 'start' }, ({ payload }) => {
        if (myRole === 'guest') startAsGuest(payload);
      });
      channel.on('broadcast', { event: 'full' }, ({ payload }) => {
        if (myRole === 'guest' && payload && payload.to === myId) {
          setMpStatus('Лобби уже занято другим игроком', 'bad');
          leaveRoom();
        }
      });
      channel.on('broadcast', { event: 'bye' }, ({ payload }) => {
        if (payload && payload.from !== myId) handlePartnerLeft();
      });
      channel.subscribe(status => {
        if (status === 'SUBSCRIBED') {
          channel.track({ id: myId, role: myRole, nick: getNick(), ts: Date.now() });
          setMpStatus(myRole === 'host' ? 'Лобби создано. Отправь код другу.' : 'Подключено. Ждём старта хоста.', 'good');
          updateLobbyUI();
          resolve(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setMpStatus('Не удалось подключиться к лобби. Проверь интернет.', 'bad');
          leaveRoom();
          resolve(false);
        }
      });
    } catch (e) {
      setMpStatus('Ошибка соединения', 'bad');
      resolve(false);
    }
  });
}

function handlePresenceSync() {
  if (!channel) return;
  const state = channel.presenceState();
  const metas = Object.values(state).flat();
  const guests = metas.filter(m => m.role === 'guest').sort((a, b) => a.ts - b.ts);
  const hosts = metas.filter(m => m.role === 'host').sort((a, b) => a.ts - b.ts);

  if (myRole === 'host') {
    const partner = guests[0] || null;
    const was = partnerConnected;
    partnerConnected = !!partner;
    partnerNick = partner ? partner.nick : '';
    if (guests.length > 1) {
      channel.send({ type: 'broadcast', event: 'full', payload: { to: guests[1].id } });
    }
    if (gameStarted && isOnline() && !isGuest()) {
      if (was && !partnerConnected) {
        pieces[1] = null;
        drops[1] = null;
        next[1] = null;
        isPaused = true;
        updatePauseBtn();
        toast('Игрок 2 отключился', 'bad');
      }
      if (!was && partnerConnected) {
        toast('Игрок 2 подключился', 'good');
        alive[1] = true;
        if (!pieces[1]) spawnPiece(1);
        isPaused = false;
        updatePauseBtn();
      }
      sendState(true);
    }
  } else {
    const host = hosts[0] || null;
    const was = partnerConnected;
    partnerConnected = !!host;
    partnerNick = host ? host.nick : '';
    if (guests.length > 1 && guests[0] && guests[0].id !== myId) {
      setMpStatus('Лобби уже занято другим игроком', 'bad');
      leaveRoom();
      return;
    }
    if (gameStarted && isGuest() && was && !partnerConnected) {
      netLost = true;
      toast('Хост отключился', 'bad');
    }
  }
  updateLobbyUI();
  updateModeUI();
}

function handlePartnerLeft() {
  partnerConnected = false;
  partnerNick = '';
  if (isOnline() && !isGuest() && gameStarted) {
    pieces[1] = null;
    drops[1] = null;
    next[1] = null;
    isPaused = true;
    updatePauseBtn();
    sendState(true);
  }
  if (isGuest()) netLost = true;
  toast('Игрок вышел из лобби', 'bad');
  updateLobbyUI();
  updateModeUI();
}

function leaveRoom() {
  if (channel) {
    try { channel.send({ type: 'broadcast', event: 'bye', payload: { from: myId } }); } catch (e) {}
    try { channel.unsubscribe(); } catch (e) {}
    try { db.realtime.removeChannel(channel); } catch (e) {}
    channel = null;
  }
  partnerConnected = false;
  partnerNick = '';
  roomCode = '';
  myRole = null;
  netLost = false;
  updateLobbyUI();
}

mpCreate.addEventListener('click', async () => {
  mpCreate.blur();
  if (!db) return setMpStatus('Онлайн недоступен: сервер не подключён', 'bad');
  if (channel) leaveRoom();
  myRole = 'host';
  roomCode = makeCode();
  setMpStatus('Создаём лобби…', 'warn');
  updateLobbyUI();
  await joinChannel();
});

mpJoin.addEventListener('click', async () => {
  mpJoin.blur();
  if (!db) return setMpStatus('Онлайн недоступен: сервер не подключён', 'bad');
  const code = mpCodeInput.value.trim().toUpperCase();
  if (code.length !== 4) return setMpStatus('Введи 4 символа кода', 'warn');
  if (channel) leaveRoom();
  myRole = 'guest';
  roomCode = code;
  setMpStatus('Подключаемся к лобби…', 'warn');
  updateLobbyUI();
  await joinChannel();
});

mpCodeInput.addEventListener('input', () => {
  mpCodeInput.value = mpCodeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
});

mpCodeInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); mpJoin.click(); }
});

async function copyText(text, okMsg) {
  try {
    await navigator.clipboard.writeText(text);
    toast(okMsg, 'good');
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      toast(okMsg, 'good');
    } catch (err) {
      toast('Не удалось скопировать', 'bad');
    }
    ta.remove();
  }
}

mpCopyCode.addEventListener('click', () => copyText(roomCode, 'Код скопирован'));
mpCopyLink.addEventListener('click', () => copyText(location.href.split('#')[0] + '#room=' + roomCode, 'Ссылка скопирована'));

mpLeave.addEventListener('click', () => {
  leaveRoom();
  setMpStatus('Ты вышел из лобби', 'warn');
});

mpExitBtn.addEventListener('click', () => {
  mpExitBtn.blur();
  exitToMenu();
  toast('Ты вышел из лобби', 'warn');
});

mpStartOnline.addEventListener('click', () => {
  mpStartOnline.blur();
  if (myRole !== 'host' || !partnerConnected) return;
  matchNicks = [getNick(), partnerNick || 'Игрок 2'];
  startMode(selectedOnlineMode === 'battle' ? 'battle-host' : 'coop-host');
  broadcastStart();
  toast('Матч начался!', 'good');
});

function broadcastStart() {
  if (!channel || !isOnline() || isGuest()) return;
  channel.send({ type: 'broadcast', event: 'start', payload: buildNetState() });
}

function startAsGuest(payload) {
  mode = payload.md || 'coop-guest';
  applyLayout();
  gameContainer.classList.add('settings-hidden');
  mainMenu.classList.add('hidden');
  mpModal.classList.add('hidden');
  gameStarted = true;
  netLost = false;
  scoreSubmitted = false;
  particles = [];
  trailParticles = [];
  lineFlashes = [];
  alive = [true, true];
  playerScores = [0, 0];
  applyNetState(payload);
  setLbMode(isBattle() ? 'battle' : 'coop');
  updateModeUI();
  startLoop();
  toast(isBattle() ? 'Битва началась! Ты — Игрок 2' : 'Матч начался! Ты — Игрок 2', 'good');
}

function buildNetState() {
  return {
    md: mode,
    b: boards.map(b => b.map(r => r.map(t => t ? (CELL_CHARS[t] || 'B') : '.').join(''))),
    p: pieces.map(p => p ? { t: p.type, m: p.matrix, x: p.x, y: p.y } : null),
    d: drops.map(d => d ? { t: d.type, m: d.matrix, x: d.x, y: d.y, s: d.startY, o: d.animOffset } : null),
    n: next.map(n => n ? { t: n.type, m: n.matrix } : null),
    al: [alive[0] ? 1 : 0, alive[1] ? 1 : 0],
    ps: [playerScores[0], playerScores[1]],
    sc: score,
    scs: scores,
    ln: lines,
    lv: level,
    di: Math.round(dropInterval || speedSettings.start),
    bt: battleTimer,
    be: battleEnded ? 1 : 0,
    bw: battleWinner,
    bh: bossHP,
    ba: isBossActive ? 1 : 0,
    bp: isBossPaused ? 1 : 0,
    btarget: bossScoreTarget,
    go: gameOver ? 1 : 0,
    pa: isPaused ? 1 : 0,
    h: hue,
    mn: matchNicks
  };
}

function sendState(force) {
  if (!isOnline() || isGuest() || !channel) return;
  const now = performance.now();
  if (!force && now - lastNetSend < 50) return;
  lastNetSend = now;
  try {
    channel.send({ type: 'broadcast', event: 'state', payload: buildNetState() });
  } catch (e) {}
}

function sendFx(payload) {
  if (!isOnline() || isGuest() || !channel) return;
  try {
    channel.send({ type: 'broadcast', event: 'fx', payload });
  } catch (e) {}
}

function sendInput(action) {
  if (!channel) return;
  try {
    channel.send({ type: 'broadcast', event: 'input', payload: { from: myId, a: action } });
  } catch (e) {}
}

function applyNetState(s) {
  if (!s || !s.b) return;
  if (s.md && s.md !== mode) {
    mode = s.md;
    applyLayout();
  }
  boards = s.b.map(rowStrs => rowStrs.map(r => r.split('').map(ch => CHAR_CELLS[ch] || null)));
  pieces = s.p.map((o, idx) => o ? { type: o.t, matrix: o.m, x: o.x, y: o.y, owner: idx } : null);
  drops = s.d.map((o, idx) => o ? { type: o.t, matrix: o.m, x: o.x, y: o.y, startY: o.s, animOffset: o.o, owner: idx } : null);
  next = s.n.map(o => o ? { type: o.t, matrix: o.m, x: 0, y: 0 } : null);
  alive = s.al ? [!!s.al[0], !!s.al[1]] : [true, true];
  playerScores = (s.ps && s.ps.length === 2) ? [s.ps[0], s.ps[1]] : [0, 0];
  score = s.sc;
  scores = s.scs || [0, 0];
  lines = s.ln;
  level = s.lv;
  dropInterval = s.di;
  hue = s.h;
  battleTimer = s.bt;
  battleEnded = !!s.be;
  battleWinner = s.bw;
  bossHP = s.bh;
  bossScoreTarget = s.btarget;
  isBossActive = !!s.ba;
  isBossPaused = !!s.bp;
  isPaused = !!s.pa;
  if (s.mn) matchNicks = s.mn;
  const wasOver = gameOver;
  gameOver = !!s.go;
  if (gameOver && !wasOver && !scoreSubmitted) scoreSubmitted = true;
  if (!gameOver) scoreSubmitted = false;
  lastStateAt = performance.now();
  if (netLost) {
    netLost = false;
    updateModeUI();
  }
  updateUI();
  updateBossUI();
  syncBossModal();
  updatePauseBtn();
  updateBattleHud();
  drawNext();
}

function applyNetFx(f) {
  if (!f) return;
  if (f.t === 'clear') {
    (f.rows || []).forEach(r => createLineExplosion(r.y, r.c.split('').map(ch => CHAR_CELLS[ch] || null), f.bi || 0));
    addShake(f.s || 4, 200);
  } else if (f.t === 'land') {
    createParticles({ type: f.p.t, matrix: f.p.m, x: f.p.x, y: f.p.y, owner: f.o || 0 });
    addShake(5, 170);
  } else if (f.t === 'boss') {
    addShake(7, 350);
  } else if (f.t === 'win') {
    addShake(9, 450);
    toast('👹 Боссик повержен! Поле очищено', 'good');
  }
}

function exitToMenu() {
  gameStarted = false;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  leaveRoom();
  mode = 'single';
  applyLayout();
  pieces = [null, null];
  drops = [null, null];
  next = [null, null];
  alive = [true, true];
  playerScores = [0, 0];
  particles = [];
  trailParticles = [];
  lineFlashes = [];
  gameOver = false;
  isPaused = false;
  isBossActive = false;
  isBossPaused = false;
  shakeTime = 0;
  gameContainer.style.transform = '';
  gameContainer.classList.remove('settings-hidden');
  syncBossModal();
  updatePauseBtn();
  updateModeUI();
  setLbMode('single');
  mainMenu.classList.remove('hidden');
  draw();
}

document.addEventListener('keydown', e => {
  const ae = document.activeElement;
  if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) return;
  if (!gameStarted) return;

  if (e.code === 'KeyP' || e.code === 'Escape') {
    e.preventDefault();
    togglePause();
    return;
  }
  if (gameOver) return;

  if (e.code === 'Digit6' || e.code === 'Digit7') {
    secretCodeBuffer += e.code === 'Digit6' ? '6' : '7';
    if (secretCodeBuffer.includes('67')) {
      secretShapeActive = true;
      secretCodeBuffer = '';
      toast('Секретная фигура активирована');
    }
    if (secretCodeBuffer.length > 5) secretCodeBuffer = '';
  } else {
    secretCodeBuffer = '';
  }

  let target = -1;
  let action = null;

  if (mode === 'single') {
    action = P1_MAP[e.code] || P2_MAP[e.code] || SINGLE_EXTRA_DROP[e.code] || null;
    target = 0;
  } else if (mode === 'coop-local' || mode === 'battle-local') {
    if (P1_MAP[e.code]) { target = 0; action = P1_MAP[e.code]; }
    else if (P2_MAP[e.code]) { target = 1; action = P2_MAP[e.code]; }
  } else if (isGuest()) {
    action = P1_MAP[e.code] || P2_MAP[e.code] || null;
    target = 1;
  } else if (isOnline()) {
    action = P1_MAP[e.code] || P2_MAP[e.code] || null;
    target = 0;
  }

  if (!action) return;
  e.preventDefault();
  if (e.repeat && action === 'drop') return;
  doInput(target, action);
});

function bindPad(el, getPlayer, action, repeatable) {
  let delayTimer = null;
  let repeatTimer = null;
  const fire = () => {
    const p = getPlayer();
    if (p < 0) return;
    doInput(p, action);
  };
  const stop = () => {
    clearTimeout(delayTimer);
    clearInterval(repeatTimer);
    delayTimer = null;
    repeatTimer = null;
  };
  el.addEventListener('pointerdown', e => {
    e.preventDefault();
    el.blur();
    fire();
    if (repeatable) {
      delayTimer = setTimeout(() => {
        repeatTimer = setInterval(fire, 80);
      }, 200);
    }
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => el.addEventListener(ev, stop));
  el.addEventListener('contextmenu', e => e.preventDefault());
}

const singleTarget = () => 0;
const padOneTarget = () => isGuest() ? -1 : 0;
const padTwoTarget = () => (isOnline() && !isGuest()) ? -1 : 1;

bindPad(document.getElementById('mob-left'), singleTarget, 'left', true);
bindPad(document.getElementById('mob-right'), singleTarget, 'right', true);
bindPad(document.getElementById('mob-down'), singleTarget, 'down', true);
bindPad(document.getElementById('mob-rotate'), singleTarget, 'rotate', false);
bindPad(document.getElementById('mob-drop'), singleTarget, 'drop', false);

bindPad(document.getElementById('m1-left'), padOneTarget, 'left', true);
bindPad(document.getElementById('m1-right'), padOneTarget, 'right', true);
bindPad(document.getElementById('m1-down'), padOneTarget, 'down', true);
bindPad(document.getElementById('m1-rotate'), padOneTarget, 'rotate', false);
bindPad(document.getElementById('m1-drop'), padOneTarget, 'drop', false);

bindPad(document.getElementById('m2-left'), padTwoTarget, 'left', true);
bindPad(document.getElementById('m2-right'), padTwoTarget, 'right', true);
bindPad(document.getElementById('m2-down'), padTwoTarget, 'down', true);
bindPad(document.getElementById('m2-rotate'), padTwoTarget, 'rotate', false);
bindPad(document.getElementById('m2-drop'), padTwoTarget, 'drop', false);

loadSettings();
applyUIColors();
buildThemePresets();
buildColorsPanel();
buildUIColorsPanel();
updateSpeedUI();
updateBgStatus();
applyLayout();
updatePauseBtn();
updateModeUI();
updateLobbyUI();
syncBossModal();
fitBoard();
draw();
setLbMode('single');

if (!db) setMpStatus('Онлайн недоступен: сервер не подключён. Локальный мультиплеер работает.', 'bad');

const hashMatch = location.hash.match(/room=([A-Za-z0-9]{4})/);
if (hashMatch) {
  mpModal.classList.remove('hidden');
  mpTabOnline.click();
  mpCodeInput.value = hashMatch[1].toUpperCase();
  setMpStatus('Код из ссылки подставлен — нажми «Подключиться»', 'warn');
}