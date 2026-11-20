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

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;
const LINES_PER_LEVEL = 8;
const DEFAULT_SPEED = { start: 800, step: 55, min: 90 };
let speedSettings = { ...DEFAULT_SPEED };

const FIRST_BOSS_SCORE = 10000;
const BOSS_SCORE_AFTER_WIN = 25000;
const BOSS_MAX_HP = 400;
let bossScoreTarget = FIRST_BOSS_SCORE;
let bossHP = BOSS_MAX_HP;
let isBossActive = false;
let isAdmin = false;
let cheatSquaresActive = false;

let particles = [];
let trailParticles = [];
let lineFlashes = [];
let droppingPiece = null;
let hue = 0;
let secretCodeBuffer = "";
let secretShapeActive = false;
let leaderboardClicks = 0;
let heartClicks = 0;
let isEasterEggOpen = false;

let shakeTime = 0;
let shakeDur = 1;
let shakePower = 0;
const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nctx = nextCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const speedEl = document.getElementById('speed');
const restartBtn = document.getElementById('restart');
const pauseBtn = document.getElementById('pause-btn');
const soundBtn = document.getElementById('sound-btn');
const bossHud = document.getElementById('boss-hud');
const bossHudFill = document.getElementById('boss-hud-fill');
const bossHudText = document.getElementById('boss-hud-text');
const adminPanel = document.getElementById('admin-panel');
const adminTargetNick = document.getElementById('admin-target-nick');
const adminSetScore = document.getElementById('admin-set-score');
const adminNewNick = document.getElementById('admin-new-nick');
const bossModal = document.getElementById('boss-modal');
const btnStartBoss = document.getElementById('btn-start-boss');
const nickInput = document.getElementById('player-nick');
const leaderboardList = document.getElementById('leaderboard-list');
const mainMenu = document.getElementById('main-menu');
const menuNick = document.getElementById('menu-nick');
const btnPlay = document.getElementById('btn-play');
const themePresetsBox = document.getElementById('theme-presets');
const gameContainer = document.querySelector('.game-container');

const SHAPES = {
  I: [[1,1,1,1]],
  O: [[1,1],[1,1]],
  T: [[0,1,0],[1,1,1]],
  S: [[0,1,1],[1,1,0]],
  Z: [[1,1,0],[0,1,1]],
  J: [[1,0,0],[1,1,1]],
  L: [[0,0,1],[1,1,1]]
};

const CHEAT_SHAPES = {
  BLOCK_2x5: [[1,1],[1,1],[1,1],[1,1],[1,1]],
  SECRET: [
    [0,0,1,1,0,0],
    [0,0,1,1,0,0],
    [0,0,1,1,0,0],
    [0,0,1,1,0,0],
    [0,0,1,1,0,0],
    [0,0,1,1,0,0],
    [1,1,0,0,1,1],
    [1,1,0,0,1,1]
  ]
};

const BOSS_SHAPES = {
  PLUS: [[0,1,0],[1,1,1],[0,1,0]],
  DOT: [[1]],
  O_PIMPLE: [[1,1],[1,1],[1,0]],
  O_PIMPLE_MIRROR: [[1,1],[1,1],[0,1]],
  P_SHAPE: [[1,1,1],[1,0,0],[1,0,0]],
  LINE_3: [[1,1,1]],
  LINE_4: [[1,1,1,1]],
  T_SHAPE: [[1,1,1],[0,1,0],[0,1,0]],
  SMALL_G: [[1,0],[1,1]]
};

let pieceBag = [];
let bossBag = [];

function drawFromBag(bag, keys) {
  if (bag.length === 0) {
    const fresh = [...keys];
    for (let i = fresh.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fresh[i], fresh[j]] = [fresh[j], fresh[i]];
    }
    bag.push(...fresh);
  }
  return bag.pop();
}

const DEFAULT_PIECE_COLORS = {
  I: '#4ecdc4',
  O: '#ffe66d',
  T: '#c44dff',
  S: '#4dff88',
  Z: '#ff4d6d',
  J: '#4d7cff',
  L: '#ffa94d',
  BOSS: '#e94560',
  RGB: '#ff00ff'
};

const THEME_PRESETS = [
  { name: 'Космос', ui: { page: '#1a1a2e', container: '#16213e', panel: '#0f3460', inner: '#0f0f1e', accent: '#4ecdc4' } },
  { name: 'Тьма', ui: { page: '#000000', container: '#111111', panel: '#222222', inner: '#000000', accent: '#e94560' } },
  { name: 'Неон', ui: { page: '#0d0221', container: '#0f084b', panel: '#261447', inner: '#000000', accent: '#ff00ff' } },
  { name: 'Лес', ui: { page: '#1e3a2b', container: '#2a4b3a', panel: '#3b5e4b', inner: '#0f1f15', accent: '#7bed9f' } }
];

const DEFAULT_UI_COLORS = {
  page: { label: 'Фон сайта', value: THEME_PRESETS[0].ui.page },
  container: { label: 'Контейнер', value: THEME_PRESETS[0].ui.container },
  panel: { label: 'Панели', value: THEME_PRESETS[0].ui.panel },
  inner: { label: 'Поле', value: THEME_PRESETS[0].ui.inner },
  accent: { label: 'Акцент', value: THEME_PRESETS[0].ui.accent }
};

let PIECE_COLORS = { ...DEFAULT_PIECE_COLORS };
let UI_COLORS = {};
Object.keys(DEFAULT_UI_COLORS).forEach(k => UI_COLORS[k] = DEFAULT_UI_COLORS[k].value);

let board, current, next, score, lines, level, dropInterval, dropCounter, lastTime, gameOver, rafId;
let backgroundImage = null;
let uiOpacity = 75;
let useBgInBoard = true;
let gameStarted = false;
let isBossPaused = false;
let isPaused = false;

let audioCtx = null;
let masterGain = null;
let soundOn = localStorage.getItem('tetris-sound') !== 'off';

function ensureAudio() {
  if (audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return;
  }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx = new AC();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = soundOn ? 0.5 : 0;
    masterGain.connect(audioCtx.destination);
  } catch (e) {
    audioCtx = null;
  }
}

function beep(freq, dur, type = 'square', vol = 0.15, delay = 0, slideTo = null) {
  if (!audioCtx || !soundOn || !masterGain) return;
  try {
    const t0 = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  } catch (e) {}
}

const sfx = {
  move: () => beep(220, 0.04, 'square', 0.06),
  rotate: () => beep(330, 0.06, 'square', 0.09, 0, 440),
  hard: () => {
    beep(110, 0.12, 'sawtooth', 0.22, 0, 45);
    beep(60, 0.1, 'square', 0.14, 0.01);
  },
  clear: (n) => {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const count = Math.min(4, n + 1);
    for (let i = 0; i < count; i++) beep(notes[i], 0.1, 'square', 0.14, i * 0.06);
    if (n >= 4) beep(1318.5, 0.22, 'square', 0.16, 0.26);
  },
  level: () => {
    beep(440, 0.09, 'triangle', 0.15);
    beep(660, 0.14, 'triangle', 0.15, 0.09);
  },
  boss: () => {
    beep(98, 0.3, 'sawtooth', 0.2, 0, 70);
    beep(98, 0.3, 'sawtooth', 0.2, 0.35, 70);
  },
  bossHit: () => beep(180, 0.08, 'sawtooth', 0.12, 0, 90),
  win: () => {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => beep(f, 0.16, 'square', 0.15, i * 0.1));
  },
  over: () => {
    beep(392, 0.18, 'triangle', 0.18);
    beep(311, 0.18, 'triangle', 0.18, 0.18);
    beep(233, 0.4, 'triangle', 0.18, 0.36, 110);
  }
};

function updateSoundBtn() {
  soundBtn.textContent = soundOn ? '🔊 Звук: вкл' : '🔇 Звук: выкл';
}

soundBtn.addEventListener('click', () => {
  ensureAudio();
  soundOn = !soundOn;
  localStorage.setItem('tetris-sound', soundOn ? 'on' : 'off');
  if (masterGain) masterGain.gain.value = soundOn ? 0.5 : 0;
  updateSoundBtn();
  if (soundOn) sfx.rotate();
});

document.addEventListener('pointerdown', ensureAudio, { once: true });
document.addEventListener('keydown', ensureAudio, { once: true });

function addShake(power, dur = 180) {
  if (reducedMotion) return;
  const currentLeft = shakeTime > 0 ? shakePower * (shakeTime / shakeDur) : 0;
  shakePower = Math.max(currentLeft, power);
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
  const dx = (Math.random() * 2 - 1) * p;
  const dy = (Math.random() * 2 - 1) * p;
  gameContainer.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px)`;
}

function buildThemePresets() {
  themePresetsBox.innerHTML = '';
  THEME_PRESETS.forEach((theme, index) => {
    const btn = document.createElement('div');
    btn.className = 'theme-btn';
    btn.title = theme.name;
    btn.setAttribute('role', 'button');
    btn.tabIndex = 0;
    if (index === 0) btn.classList.add('active');
    btn.style.background = `linear-gradient(135deg, ${theme.ui.page} 0%, ${theme.ui.accent} 100%)`;
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
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    });
    themePresetsBox.appendChild(btn);
  });
}

function checkAdmin(nick) {
  isAdmin = nick === 'ADM1N';
  adminPanel.style.display = isAdmin ? 'block' : 'none';
}

btnPlay.addEventListener('click', () => {
  ensureAudio();
  const nick = menuNick.value.trim() || 'Игрок';
  nickInput.value = nick;
  localStorage.setItem('tetris-nick', nick);
  checkAdmin(nick);
  mainMenu.classList.add('hidden');
  gameStarted = true;
  btnPlay.blur();
  reset();
  sfx.level();
});

nickInput.addEventListener('input', () => {
  localStorage.setItem('tetris-nick', nickInput.value.trim());
  if (menuNick.value !== nickInput.value) menuNick.value = nickInput.value;
  checkAdmin(nickInput.value.trim());
});

menuNick.addEventListener('input', () => {
  localStorage.setItem('tetris-nick', menuNick.value.trim());
  if (nickInput.value !== menuNick.value) nickInput.value = menuNick.value;
});

menuNick.addEventListener('keydown', e => {
  if (e.key === 'Enter') btnPlay.click();
});

function togglePause() {
  if (!gameStarted || gameOver) return;
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? 'Продолжить (P)' : 'Пауза (P)';
  draw();
}

pauseBtn.addEventListener('click', togglePause);

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

function applyUIColors() {
  const root = document.documentElement;
  root.style.setProperty('--bg-page', UI_COLORS.page);
  root.style.setProperty('--bg-container', UI_COLORS.container);
  root.style.setProperty('--bg-panel', UI_COLORS.panel);
  root.style.setProperty('--bg-inner', UI_COLORS.inner);
  root.style.setProperty('--accent', UI_COLORS.accent);
  applyUiOpacity(uiOpacity);
  draw();
}

function applyUiOpacity(val) {
  uiOpacity = val;
  if (!backgroundImage) return;
  const percent = val / 100;
  const panelColor = hexToRgba(UI_COLORS.panel, percent);
  const containerColor = hexToRgba(UI_COLORS.container, percent);
  document.querySelectorAll('.game-container, .menu-content, .panel, .leaderboard-panel, .settings, .boss-content, .boss-bar')
    .forEach(el => {
      if (el) el.style.setProperty('background-color', panelColor, 'important');
    });
  document.querySelectorAll('.leader-item, .color-item, input[type="text"], #next')
    .forEach(el => {
      if (el) el.style.setProperty('background-color', containerColor, 'important');
    });
  if (gameContainer) gameContainer.style.setProperty('background-color', containerColor, 'important');
}

function saveSettings() {
  try {
    localStorage.setItem('tetris-piece-colors', JSON.stringify(PIECE_COLORS));
    localStorage.setItem('tetris-ui-colors', JSON.stringify(UI_COLORS));
    localStorage.setItem('tetris-speed', JSON.stringify(speedSettings));
    localStorage.setItem('tetris-ui-opacity', uiOpacity);
    localStorage.setItem('tetris-use-bg-in-board', useBgInBoard);
    if (backgroundImage && backgroundImage.src) {
      localStorage.setItem('tetris-bg', backgroundImage.src);
    } else {
      localStorage.removeItem('tetris-bg');
    }
  } catch (e) {}
}

function loadSettings() {
  try {
    const pieceRaw = localStorage.getItem('tetris-piece-colors');
    if (pieceRaw) PIECE_COLORS = { ...DEFAULT_PIECE_COLORS, ...JSON.parse(pieceRaw) };

    const uiRaw = localStorage.getItem('tetris-ui-colors');
    if (uiRaw) UI_COLORS = { ...UI_COLORS, ...JSON.parse(uiRaw) };

    const speedRaw = localStorage.getItem('tetris-speed');
    if (speedRaw) speedSettings = { ...DEFAULT_SPEED, ...JSON.parse(speedRaw) };

    const uiOpacityRaw = localStorage.getItem('tetris-ui-opacity');
    if (uiOpacityRaw) {
      uiOpacity = parseInt(uiOpacityRaw) || 75;
      const slider = document.getElementById('set-ui-opacity');
      const valEl = document.getElementById('val-ui-opacity');
      if (slider) slider.value = uiOpacity;
      if (valEl) valEl.textContent = uiOpacity;
    }

    const useBgRaw = localStorage.getItem('tetris-use-bg-in-board');
    if (useBgRaw !== null) {
      useBgInBoard = useBgRaw === 'true';
      const cb = document.getElementById('use-bg-in-board');
      if (cb) cb.checked = useBgInBoard;
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
    document.querySelectorAll('.game-container, .menu-content, .panel, .leaderboard-panel, .settings, .boss-content, .boss-bar, .leader-item, .color-item, input[type="text"], #next')
      .forEach(el => el.style.removeProperty('background-color'));
  }
}

function updateBgStatus() {
  const status = document.getElementById('bg-status');
  if (!status) return;
  status.textContent = backgroundImage ? '✅ Фото загружено' : 'Фон не задан';
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

async function fetchLeaderboard() {
  leaderboardList.innerHTML = '<div style="font-size:11px; color:#9aa; text-align:center;">Загрузка...</div>';
  if (!db) {
    leaderboardList.innerHTML = '<div style="font-size:11px; color:#9aa; text-align:center;">Лидерборд недоступен оффлайн</div>';
    return;
  }
  try {
    const { data, error } = await db.from('leaderboard').select('name, score').order('score', { ascending: false }).limit(20);
    if (error) throw error;
    leaderboardList.innerHTML = '';
    if (!data || data.length === 0) {
      leaderboardList.innerHTML = '<div style="font-size:11px; color:#9aa; text-align:center;">Пока пусто</div>';
      return;
    }
    data.forEach((entry, index) => {
      const div = document.createElement('div');
      div.className = 'leader-item';
      div.innerHTML = `
        <span class="leader-rank">${index + 1}.</span>
        <span class="leader-name">${escapeHTML(entry.name)}</span>
        <span class="leader-score">${Number(entry.score) || 0}</span>
      `;
      leaderboardList.appendChild(div);
    });
  } catch (err) {
    leaderboardList.innerHTML = `<div style="font-size:11px; color:#e94560; text-align:center; padding: 5px;">Ошибка: ${escapeHTML(err.message || 'Нет связи')}</div>`;
  }
}

async function addScoreToLeaderboard(finalScore) {
  if (finalScore <= 0 || !db) return;
  try {
    let name = nickInput.value.trim();
    if (!name) name = 'Игрок';
    const { data } = await db.from('leaderboard').select('score').eq('name', name).maybeSingle();
    if (data) {
      if (finalScore > data.score) {
        await db.from('leaderboard').update({ score: finalScore }).eq('name', name);
      }
    } else {
      await db.from('leaderboard').insert({ name: name, score: finalScore });
    }
    await fetchLeaderboard();
  } catch (e) {}
}

document.getElementById('easter-egg-trigger').addEventListener('click', () => {
  if (isEasterEggOpen) {
    isEasterEggOpen = false;
    leaderboardClicks = 0;
    heartClicks = 0;
    document.getElementById('credits-panel').style.display = 'none';
    document.getElementById('final-credit').style.display = 'none';
    return;
  }
  if (leaderboardClicks < 13) leaderboardClicks++;
  if (leaderboardClicks === 13) {
    isEasterEggOpen = true;
    document.getElementById('credits-panel').style.display = 'block';
  }
});

document.getElementById('heart-trigger').addEventListener('click', () => {
  if (!isEasterEggOpen) return;
  if (heartClicks < 6) heartClicks++;
  if (heartClicks === 6) {
    document.getElementById('final-credit').style.display = 'block';
  }
});

document.getElementById('admin-clear').addEventListener('click', () => {
  if (!isAdmin) return;
  board = createBoard();
  score += 100;
  updateUI();
  draw();
});

document.getElementById('admin-squares').addEventListener('click', () => {
  if (!isAdmin) return;
  cheatSquaresActive = !cheatSquaresActive;
  document.getElementById('admin-squares').textContent = cheatSquaresActive ? 'Выключить читы' : 'Включить фигуру 2x5';
});

document.getElementById('admin-apply-score').addEventListener('click', async () => {
  if (!isAdmin) return;
  if (!db) return alert('Лидерборд недоступен оффлайн');
  const target = adminTargetNick.value.trim();
  const scoreVal = parseInt(adminSetScore.value);
  if (!target || isNaN(scoreVal)) return alert('Введи ник и очки!');
  try {
    const { data } = await db.from('leaderboard').select('score').eq('name', target).maybeSingle();
    if (data) {
      await db.from('leaderboard').update({ score: scoreVal }).eq('name', target);
    } else {
      await db.from('leaderboard').insert({ name: target, score: scoreVal });
    }
    fetchLeaderboard();
    alert(`Очки ${scoreVal} выданы игроку ${target}`);
  } catch (e) {
    alert('Ошибка связи с базой');
  }
});

document.getElementById('admin-apply-nick').addEventListener('click', async () => {
  if (!isAdmin) return;
  if (!db) return alert('Лидерборд недоступен оффлайн');
  const target = adminTargetNick.value.trim();
  const newNick = adminNewNick.value.trim();
  if (!target || !newNick) return alert('Введи старый и новый ник!');
  try {
    await db.from('leaderboard').update({ name: newNick }).eq('name', target);
    fetchLeaderboard();
    alert(`Ник ${target} изменен на ${newNick}`);
  } catch (e) {
    alert('Ошибка связи с базой');
  }
});

const colorsPanel = document.getElementById('colors-panel');

function buildColorsPanel() {
  colorsPanel.innerHTML = '';
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
    colorsPanel.appendChild(item);
  });
}

const uiColorsPanel = document.getElementById('ui-colors-panel');

function buildUIColorsPanel() {
  uiColorsPanel.innerHTML = '';
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
      draw();
    });
    const label = document.createElement('span');
    label.textContent = DEFAULT_UI_COLORS[key].label;
    item.appendChild(input);
    item.appendChild(label);
    uiColorsPanel.appendChild(item);
  });
}

const setStartSpeed = document.getElementById('set-start-speed');
const setSpeedStep = document.getElementById('set-speed-step');
const setMinSpeed = document.getElementById('set-min-speed');
const valStart = document.getElementById('val-start');
const valStep = document.getElementById('val-step');
const valMin = document.getElementById('val-min');

function updateSpeedUI() {
  setStartSpeed.value = speedSettings.start;
  setSpeedStep.value = speedSettings.step;
  setMinSpeed.value = speedSettings.min;
  valStart.textContent = speedSettings.start;
  valStep.textContent = speedSettings.step;
  valMin.textContent = speedSettings.min;
}

setStartSpeed.addEventListener('input', () => {
  speedSettings.start = parseInt(setStartSpeed.value);
  valStart.textContent = speedSettings.start;
  if (!gameOver && gameStarted) {
    dropInterval = recalcSpeed();
    updateUI();
  }
  saveSettings();
});

setSpeedStep.addEventListener('input', () => {
  speedSettings.step = parseInt(setSpeedStep.value);
  valStep.textContent = speedSettings.step;
  if (!gameOver && gameStarted) {
    dropInterval = recalcSpeed();
    updateUI();
  }
  saveSettings();
});

setMinSpeed.addEventListener('input', () => {
  speedSettings.min = parseInt(setMinSpeed.value);
  valMin.textContent = speedSettings.min;
  if (!gameOver && gameStarted) {
    dropInterval = recalcSpeed();
    updateUI();
  }
  saveSettings();
});

const setUiOpacity = document.getElementById('set-ui-opacity');
const valUiOpacity = document.getElementById('val-ui-opacity');

if (setUiOpacity) {
  setUiOpacity.addEventListener('input', () => {
    const val = parseInt(setUiOpacity.value);
    valUiOpacity.textContent = val;
    applyUiOpacity(val);
    saveSettings();
    draw();
  });
}

const useBgInBoardCb = document.getElementById('use-bg-in-board');

if (useBgInBoardCb) {
  useBgInBoardCb.addEventListener('change', () => {
    useBgInBoard = useBgInBoardCb.checked;
    saveSettings();
    draw();
  });
}

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
  if (setUiOpacity) setUiOpacity.value = 75;
  if (valUiOpacity) valUiOpacity.textContent = 75;
  if (useBgInBoardCb) useBgInBoardCb.checked = true;
  backgroundImage = null;
  applyBackgroundToUI(null);
  applyUIColors();
  updateBgStatus();
  buildColorsPanel();
  buildUIColorsPanel();
  updateSpeedUI();
  saveSettings();
  if (gameStarted) reset();
});

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function newPiece() {
  if (cheatSquaresActive) {
    const type = 'BLOCK_2x5';
    return {
      type: 'RGB',
      matrix: CHEAT_SHAPES[type].map(r => [...r]),
      x: Math.floor((COLS - 2) / 2),
      y: 0
    };
  }

  if (secretShapeActive) {
    secretShapeActive = false;
    const type = 'SECRET';
    return {
      type: 'O',
      matrix: CHEAT_SHAPES[type].map(r => [...r]),
      x: Math.floor((COLS - 6) / 2),
      y: 0
    };
  }

  if (isBossActive) {
    const keys = Object.keys(BOSS_SHAPES);
    const type = drawFromBag(bossBag, keys);
    return {
      type: 'BOSS',
      matrix: BOSS_SHAPES[type].map(r => [...r]),
      x: Math.floor((COLS - BOSS_SHAPES[type][0].length) / 2),
      y: 0
    };
  }

  const keys = Object.keys(SHAPES);
  const type = drawFromBag(pieceBag, keys);
  return {
    type,
    matrix: SHAPES[type].map(r => [...r]),
    x: Math.floor((COLS - SHAPES[type][0].length) / 2),
    y: 0
  };
}

function rotate(matrix) {
  const N = matrix.length;
  const M = matrix[0].length;
  const result = Array.from({ length: M }, () => Array(N).fill(0));
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < M; x++) {
      result[x][N - 1 - y] = matrix[y][x];
    }
  }
  return result;
}

function collide(b, piece) {
  for (let y = 0; y < piece.matrix.length; y++) {
    for (let x = 0; x < piece.matrix[y].length; x++) {
      if (!piece.matrix[y][x]) continue;
      const py = piece.y + y;
      const px = piece.x + x;
      if (px < 0 || px >= COLS || py >= ROWS) return true;
      if (py >= 0 && b[py][px]) return true;
    }
  }
  return false;
}

function getGhostY() {
  const ghost = { ...current, matrix: current.matrix };
  while (!collide(board, { ...ghost, y: ghost.y + 1 })) ghost.y++;
  return ghost.y;
}

function merge(b, piece) {
  piece.matrix.forEach((row, y) => {
    row.forEach((v, x) => {
      if (v && piece.y + y >= 0) b[piece.y + y][piece.x + x] = piece.type;
    });
  });
}

function updateBossUI() {
  if (!bossHud || !bossHudFill || !bossHudText) return;
  const percent = Math.max(0, (bossHP / BOSS_MAX_HP) * 100);
  bossHudFill.style.width = percent + '%';
  bossHudText.textContent = `${Math.max(0, bossHP)} / ${BOSS_MAX_HP}`;
}

function checkForBoss() {
  if (!isBossActive && !isBossPaused && score >= bossScoreTarget) triggerBoss();
}

function startBossFight() {
  bossHP = BOSS_MAX_HP;
  isBossActive = true;
  isBossPaused = false;
  bossBag = [];
  bossModal.classList.add('hidden');
  if (bossHud) bossHud.style.display = 'flex';
  updateBossUI();
  board = createBoard();
  particles = [];
  trailParticles = [];
  lineFlashes = [];
  droppingPiece = null;
  current = newPiece();
  next = newPiece();
  drawNext();
  dropInterval = recalcSpeed();
  updateUI();
  draw();
}

function triggerBoss() {
  isBossActive = true;
  isBossPaused = true;
  bossHP = BOSS_MAX_HP;
  updateBossUI();
  bossModal.classList.remove('hidden');
  droppingPiece = null;
  if (bossHud) bossHud.style.display = 'flex';
  addShake(7, 350);
  sfx.boss();
}

function createLineExplosion(rowIndex, rowTypes) {
  rowTypes.forEach((type, x) => {
    if (!type) return;
    const color = type === 'RGB' ? `hsl(${hue}, 100%, 50%)` : (PIECE_COLORS[type] || PIECE_COLORS.BOSS);
    const cx = x * BLOCK + BLOCK / 2;
    const cy = rowIndex * BLOCK + BLOCK / 2;
    for (let i = 0; i < 5; i++) {
      particles.push({
        x: cx + (Math.random() - 0.5) * BLOCK,
        y: cy + (Math.random() - 0.5) * BLOCK,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 5 - 1.5,
        size: BLOCK * (0.3 + Math.random() * 0.25),
        color: color,
        life: 1.0
      });
    }
  });
  lineFlashes.push({ y: rowIndex, life: 1.0 });
  if (particles.length > 700) particles.splice(0, particles.length - 700);
}

function clearLines() {
  let cleared = 0;

  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every(cell => cell)) {
      createLineExplosion(y, board[y]);
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(null));
      cleared++;
      y++;
    }
  }

  if (!cleared) return;

  const points = [0, 100, 300, 500, 800];
  score += points[cleared] * level;
  lines += cleared;
  sfx.clear(cleared);
  addShake(2 + cleared * 1.5, 200);

  if (isBossActive) {
    const dmg = cleared * 15;
    bossHP -= dmg;
    updateBossUI();
    sfx.bossHit();

    if (bossHP <= 0) {
      isBossActive = false;
      if (bossHud) bossHud.style.display = 'none';
      bossScoreTarget = score + BOSS_SCORE_AFTER_WIN;
      board = createBoard();
      dropCounter = 0;
      addShake(9, 450);
      sfx.win();
    }
  } else {
    checkForBoss();
  }

  const newLevel = Math.floor(lines / LINES_PER_LEVEL) + 1;
  if (newLevel !== level) level = newLevel;
  dropInterval = recalcSpeed();
  updateUI();
}

function recalcSpeed() {
  if (!dropInterval) dropInterval = speedSettings.start;
  const progress = (lines % LINES_PER_LEVEL) / LINES_PER_LEVEL;
  const targetSpeed = Math.max(speedSettings.min, speedSettings.start - (level - 1) * speedSettings.step);
  return Math.max(speedSettings.min, targetSpeed * (1 - progress * 0.25));
}

function updateUI() {
  scoreEl.textContent = score;
  linesEl.textContent = lines;
  levelEl.textContent = level;
  const pct = Math.round((speedSettings.start / dropInterval) * 100);
  speedEl.textContent = pct + '%';
}

function drawBlock(c, x, y, color, size = BLOCK, alpha = 1) {
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = color;
  c.fillRect(x * size, y * size, size, size);
  c.strokeStyle = '#000';
  c.lineWidth = 2;
  c.strokeRect(x * size + 1, y * size + 1, size - 2, size - 2);
  c.fillStyle = 'rgba(255, 255, 255, 0.8)';
  c.fillRect(x * size + 2, y * size + 2, size - 8, 2);
  c.fillRect(x * size + 2, y * size + 2, 2, size - 8);
  c.fillStyle = 'rgba(0, 0, 0, 0.4)';
  c.fillRect(x * size + 6, y * size + size - 4, size - 8, 2);
  c.fillRect(x * size + size - 4, y * size + 6, 2, size - 8);
  c.restore();
}

function drawGhostBlock(c, x, y, color, size = BLOCK) {
  const px = x * size;
  const py = y * size;
  c.save();
  c.globalAlpha = 0.45;
  c.fillStyle = color;
  c.fillRect(px, py, size, size);
  c.globalAlpha = 1;
  c.strokeStyle = color;
  c.lineWidth = 2;
  c.strokeRect(px + 1, py + 1, size - 2, size - 2);
  c.globalAlpha = 0.6;
  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.fillRect(px + 4, py + 4, size - 8, 3);
  c.restore();
}

function createParticles(piece) {
  const color = PIECE_COLORS[piece.type] || PIECE_COLORS.BOSS;
  piece.matrix.forEach((row, y) => {
    row.forEach((v, x) => {
      if (!v) return;
      const cx = (piece.x + x) * BLOCK + BLOCK / 2;
      const cy = (piece.y + y) * BLOCK + BLOCK / 2;
      for (let i = 0; i < 3; i++) {
        particles.push({
          x: cx + (Math.random() - 0.5) * BLOCK,
          y: cy + (Math.random() - 0.5) * BLOCK,
          vx: (Math.random() - 0.5) * 4,
          vy: -Math.random() * 4 - 2,
          size: BLOCK * 0.4,
          color: piece.type === 'RGB' ? `hsl(${hue}, 100%, 50%)` : color,
          life: 1.0
        });
      }
    });
  });
}

function createTrailParticles(piece) {
  const color = PIECE_COLORS[piece.type] || PIECE_COLORS.BOSS;
  piece.matrix.forEach((row, y) => {
    row.forEach((v, x) => {
      if (!v) return;
      const cx = (piece.x + x) * BLOCK + Math.random() * BLOCK;
      const cy = (piece.y + y + (piece.animOffset || 0)) * BLOCK;
      trailParticles.push({
        x: cx,
        y: cy,
        vx: (Math.random() - 0.5) * 1.5,
        vy: Math.random() * 2 + 1,
        size: Math.random() * 6 + 2,
        color: piece.type === 'RGB' ? `hsl(${hue}, 100%, 50%)` : color,
        life: 1.0
      });
    });
  });
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

function drawParticles() {
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
}

function drawLineFlashes() {
  lineFlashes.forEach(f => {
    ctx.save();
    ctx.globalAlpha = f.life * 0.75;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, f.y * BLOCK, canvas.width, BLOCK);
    ctx.globalAlpha = f.life;
    ctx.fillStyle = UI_COLORS.accent;
    ctx.fillRect(0, f.y * BLOCK, canvas.width, 3);
    ctx.fillRect(0, f.y * BLOCK + BLOCK - 3, canvas.width, 3);
    ctx.restore();
  });
}

function draw() {
  if (!board) return;

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
    ctx.fillStyle = 'rgba(15, 15, 30, 0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = UI_COLORS.inner;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (isBossActive) {
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    ctx.lineWidth = 1;
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * BLOCK, 0);
    ctx.lineTo(x * BLOCK, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * BLOCK);
    ctx.lineTo(canvas.width, y * BLOCK);
    ctx.stroke();
  }

  board.forEach((row, y) => row.forEach((type, x) => {
    if (!type) return;
    let color = PIECE_COLORS[type] || PIECE_COLORS.BOSS;
    if (type === 'RGB') color = `hsl(${hue}, 100%, 50%)`;
    drawBlock(ctx, x, y, color);
  }));

  drawLineFlashes();

  if (current && !gameOver) {
    const ghostY = getGhostY();
    const ghostColor = current.type === 'RGB' ? `hsl(${hue}, 100%, 50%)` : (PIECE_COLORS[current.type] || PIECE_COLORS.BOSS);
    if (ghostY > current.y) {
      current.matrix.forEach((row, y) => row.forEach((v, x) => {
        if (v) drawGhostBlock(ctx, current.x + x, ghostY + y, ghostColor);
      }));
    }
    current.matrix.forEach((row, y) => row.forEach((v, x) => {
      if (v) drawBlock(ctx, current.x + x, current.y + y, ghostColor);
    }));
  }

  if (droppingPiece) {
    const color = droppingPiece.type === 'RGB' ? `hsl(${hue}, 100%, 50%)` : (PIECE_COLORS[droppingPiece.type] || PIECE_COLORS.BOSS);
    droppingPiece.matrix.forEach((row, y) => row.forEach((v, x) => {
      if (!v) return;
      const currentY = droppingPiece.y + y + (droppingPiece.animOffset || 0);
      const startY = droppingPiece.y + y;
      if (currentY > startY) {
        ctx.save();
        ctx.globalAlpha = 0.45;
        const grad = ctx.createLinearGradient(0, startY * BLOCK, 0, currentY * BLOCK);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, color);
        ctx.fillStyle = grad;
        ctx.fillRect((droppingPiece.x + x) * BLOCK, startY * BLOCK, BLOCK, (currentY - startY) * BLOCK);
        ctx.restore();
      }
      drawBlock(ctx, droppingPiece.x + x, currentY, color);
    }));
  }

  drawParticles();

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = UI_COLORS.accent;
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = '#9aa';
    ctx.font = '15px sans-serif';
    ctx.fillText('Нажми «Заново» чтобы сыграть ещё', canvas.width / 2, canvas.height / 2 + 32);
  } else if (isPaused) {
    ctx.fillStyle = 'rgba(15, 15, 30, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = UI_COLORS.accent;
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ПАУЗА', canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = '#9aa';
    ctx.font = '16px sans-serif';
    ctx.fillText('Нажмите P чтобы продолжить', canvas.width / 2, canvas.height / 2 + 30);
  }
}

function drawNext() {
  nctx.fillStyle = UI_COLORS.inner;
  nctx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  if (!next) return;
  const m = next.matrix;
  const size = Math.min(24, Math.floor((nextCanvas.width - 10) / m[0].length), Math.floor((nextCanvas.height - 10) / m.length));
  const offX = (nextCanvas.width - m[0].length * size) / 2;
  const offY = (nextCanvas.height - m.length * size) / 2;
  nctx.save();
  nctx.translate(offX, offY);
  const color = next.type === 'RGB' ? `hsl(${hue}, 100%, 50%)` : (PIECE_COLORS[next.type] || PIECE_COLORS.BOSS);
  m.forEach((row, y) => row.forEach((v, x) => {
    if (v) drawBlock(nctx, x, y, color, size);
  }));
  nctx.restore();
}

function drop() {
  if (!gameStarted || gameOver || isBossPaused || isPaused || droppingPiece || !current) return;
  current.y++;
  if (collide(board, current)) {
    current.y--;
    merge(board, current);
    clearLines();
    spawn();
  }
  dropCounter = 0;
}

function hardDrop() {
  if (!gameStarted || gameOver || isBossPaused || isPaused || droppingPiece || !current) return;
  const finalY = getGhostY();
  const distance = finalY - current.y;

  if (current.type === 'RGB' || distance <= 0) {
    current.y = finalY;
    createParticles(current);
    sfx.hard();
    addShake(5, 170);
    merge(board, current);
    clearLines();
    spawn();
    dropCounter = 0;
    return;
  }

  droppingPiece = { ...current, finalY: finalY, animOffset: 0, startY: current.y };
  current = next;
  next = newPiece();
  drawNext();
  dropCounter = 0;
}

function updateDroppingPiece(delta) {
  if (!droppingPiece) return false;
  const speed = 0.05;
  droppingPiece.animOffset += delta * speed;
  createTrailParticles(droppingPiece);

  if (droppingPiece.y + droppingPiece.animOffset >= droppingPiece.finalY) {
    droppingPiece.animOffset = 0;
    const landedPiece = { ...droppingPiece, y: droppingPiece.finalY };
    createParticles(landedPiece);
    sfx.hard();
    addShake(5, 170);
    merge(board, landedPiece);
    clearLines();
    droppingPiece = null;
    dropCounter = 0;
    if (collide(board, current)) {
      gameOver = true;
      sfx.over();
      addScoreToLeaderboard(score);
    }
    return true;
  }

  return false;
}

function spawn() {
  if (droppingPiece) return;
  current = next;
  next = newPiece();
  if (collide(board, current)) {
    gameOver = true;
    sfx.over();
    addScoreToLeaderboard(score);
  }
  drawNext();
}

function move(dir) {
  if (gameStarted && !gameOver && !isBossPaused && !isPaused && current && !droppingPiece) {
    current.x += dir;
    if (collide(board, current)) current.x -= dir;
    else sfx.move();
  }
}

function playerRotate() {
  if (!gameStarted || gameOver || isBossPaused || isPaused || !current || droppingPiece) return;
  const rotated = rotate(current.matrix);
  const old = current.matrix;
  const kicks = [0, -1, 1, -2, 2];
  current.matrix = rotated;
  for (let kick of kicks) {
    current.x += kick;
    if (!collide(board, current)) {
      sfx.rotate();
      return;
    }
    current.x -= kick;
  }
  current.matrix = old;
}

function update(time = 0) {
  if (!gameStarted) return;
  const delta = Math.min(time - lastTime, 100);
  lastTime = time;

  if (gameOver) {
    updateParticles();
    updateShake(delta);
    draw();
    if (particles.length || trailParticles.length || lineFlashes.length || shakeTime > 0) {
      rafId = requestAnimationFrame(update);
    }
    return;
  }

  if (isBossPaused || isPaused) {
    updateShake(delta);
    draw();
    rafId = requestAnimationFrame(update);
    return;
  }

  hue = (hue + 2) % 360;

  if (droppingPiece) {
    updateDroppingPiece(delta);
  } else {
    dropCounter += delta;
    if (dropCounter > dropInterval) drop();
  }

  updateParticles();
  updateShake(delta);
  draw();
  rafId = requestAnimationFrame(update);
}

function reset() {
  if (rafId) cancelAnimationFrame(rafId);
  board = createBoard();
  score = 0;
  lines = 0;
  level = 1;
  dropInterval = speedSettings.start;
  dropCounter = 0;
  lastTime = 0;
  gameOver = false;
  particles = [];
  trailParticles = [];
  lineFlashes = [];
  droppingPiece = null;
  pieceBag = [];
  bossBag = [];
  secretShapeActive = false;
  secretCodeBuffer = '';
  bossScoreTarget = FIRST_BOSS_SCORE;
  isBossActive = false;
  isBossPaused = false;
  isPaused = false;
  shakeTime = 0;
  gameContainer.style.transform = '';
  pauseBtn.textContent = 'Пауза (P)';
  bossModal.classList.add('hidden');
  if (bossHud) bossHud.style.display = 'none';
  next = newPiece();
  spawn();
  updateUI();
  update();
}

btnStartBoss.addEventListener('click', () => {
  startBossFight();
});

document.addEventListener('keydown', e => {
  const ae = document.activeElement;
  if (ae === nickInput || ae === menuNick || ae === adminTargetNick || ae === adminSetScore || ae === adminNewNick) return;
  if (!gameStarted || gameOver) return;

  if (e.key === '6' || e.key === '7') {
    secretCodeBuffer += e.key;
    if (secretCodeBuffer.includes('67')) {
      secretShapeActive = true;
      secretCodeBuffer = '';
    }
    if (secretCodeBuffer.length > 5) secretCodeBuffer = '';
  } else {
    secretCodeBuffer = '';
  }

  if (isAdmin) {
    if (e.key === 'q' || e.key === 'Q' || e.key === 'й' || e.key === 'Й') {
      board = createBoard();
      score += 100;
      updateUI();
      draw();
      return;
    }
    if (e.key === 'w' || e.key === 'W' || e.key === 'ц' || e.key === 'Ц') {
      let count = 0;
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (board[y][x]) count++;
          board[y][x] = null;
        }
      }
      score += count * 10;
      updateUI();
      draw();
      return;
    }
    if (e.key === 'e' || e.key === 'E' || e.key === 'у' || e.key === 'У') {
      cheatSquaresActive = !cheatSquaresActive;
      document.getElementById('admin-squares').textContent = cheatSquaresActive ? 'Выключить читы' : 'Включить фигуру 2x5';
      return;
    }
  }

  if (e.key === 'p' || e.key === 'P' || e.key === 'Escape' || e.key === 'з' || e.key === 'З') {
    togglePause();
    return;
  }

  if (isPaused) return;

  if (e.key === 'ArrowLeft') move(-1);
  else if (e.key === 'ArrowRight') move(1);
  else if (e.key === 'ArrowDown') drop();
  else if (e.key === 'ArrowUp') playerRotate();
  else if (e.key === ' ') {
    e.preventDefault();
    if (!e.repeat) hardDrop();
  }

  if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(e.key)) e.preventDefault();
});

document.getElementById('mob-left').addEventListener('click', () => move(-1));
document.getElementById('mob-right').addEventListener('click', () => move(1));
document.getElementById('mob-rotate').addEventListener('click', () => playerRotate());
document.getElementById('mob-down').addEventListener('click', () => drop());
document.getElementById('mob-drop').addEventListener('click', () => hardDrop());

const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
if (!isTouchDevice) {
  const mobControls = document.getElementById('mobile-controls');
  if (mobControls) mobControls.style.display = 'none';
}

restartBtn.addEventListener('click', () => {
  if (gameStarted) reset();
});

loadSettings();
applyUIColors();
buildThemePresets();
buildColorsPanel();
buildUIColorsPanel();
updateSpeedUI();
updateBgStatus();
updateSoundBtn();
fetchLeaderboard();
draw();