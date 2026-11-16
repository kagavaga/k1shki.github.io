const SUPABASE_URL = 'https://mzqgdpygxxddsfyjiaxk.supabase.co/';
const SUPABASE_ANON_KEY = 'sb_publishable_7B-N_d0iNJJzT_0VfZxN_w_lBuo5zLD';

const db = window.supabase.createClient(SUPABASE_URL.trim(), SUPABASE_ANON_KEY.trim());

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;
const LINES_PER_LEVEL = 8;
const DEFAULT_SPEED = { start: 800, step: 55, min: 90 };
let speedSettings = { ...DEFAULT_SPEED };

const FIRST_BOSS_TRIGGER = 10000; 
const NEXT_BOSS_TRIGGER = 25000;
const BOSS_MAX_HP = 400; 

let bossScoreTarget = FIRST_BOSS_TRIGGER;
let bossHP = BOSS_MAX_HP;
let isBossActive = false;
let isAdmin = false;
let cheatLinesActive = false;
let cheatNoclipActive = false; 
let rainbowTime = 0;

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

const bossModal = document.getElementById('boss-modal');
const bossHpFillModal = document.getElementById('boss-hp-fill-modal');
const bossHpTextModal = document.getElementById('boss-hp-text-modal');
const btnStartBoss = document.getElementById('btn-start-boss');

const bossBar = document.getElementById('boss-bar');
const bossHpFillBar = document.getElementById('boss-hp-fill-bar');
const bossHpTextBar = document.getElementById('boss-hp-text-bar');

const adminPanel = document.getElementById('admin-panel');
const adminTargetNick = document.getElementById('admin-target-nick');
const adminSetScore = document.getElementById('admin-set-score');
const adminNewNick = document.getElementById('admin-new-nick');

const nickInput = document.getElementById('player-nick');
const leaderboardList = document.getElementById('leaderboard-list');

const mainMenu = document.getElementById('main-menu');
const menuNick = document.getElementById('menu-nick');
const btnPlay = document.getElementById('btn-play');
const themePresetsBox = document.getElementById('theme-presets');

const SHAPES = {
  I: [[1,1,1,1]], O: [[1,1],[1,1]], T: [[0,1,0],[1,1,1]],
  S: [[0,1,1],[1,1,0]], Z: [[1,1,0],[0,1,1]], J: [[1,0,0],[1,1,1]], L: [[0,0,1],[1,1,1]]
};

const BOSS_SHAPES = {
  PLUS: [[0,1,0],[1,1,1],[0,1,0]],           
  T: [[1,1,1],[0,1,0],[0,1,0]],              
  STICK_LONG: [[1],[1],[1],[1]],             
  STICK_SHORT: [[1],[1],[1]],                
  SINGLE: [[1]],                             
  O_PIMPLE_RIGHT: [[1,1],[1,1],[0,1]],       
  O_PIMPLE_LEFT: [[1,1],[1,1],[1,0]],        
  BRIDGE: [[1,0,1],[1,1,1]]                  
};

// Теперь храним и цвет, и прозрачность
const DEFAULT_PIECE_COLORS = {
  I: { color: '#4ecdc4', alpha: 1 }, 
  O: { color: '#ffe66d', alpha: 1 }, 
  T: { color: '#c44dff', alpha: 1 },
  S: { color: '#4dff88', alpha: 1 }, 
  Z: { color: '#ff4d6d', alpha: 1 }, 
  J: { color: '#4d7cff', alpha: 1 }, 
  L: { color: '#ffa94d', alpha: 1 },
  BOSS: { color: '#e94560', alpha: 1 } 
};

const THEME_PRESETS = [
  { name: 'Космос',  ui: { page: '#1a1a2e', container: '#16213e', panel: '#0f3460', inner: '#0f0f1e', accent: '#4ecdc4' } },
  { name: 'Тьма',    ui: { page: '#000000', container: '#111111', panel: '#222222', inner: '#000000', accent: '#e94560' } },
  { name: 'Неон',    ui: { page: '#0d0221', container: '#0f084b', panel: '#261447', inner: '#000000', accent: '#ff00ff' } },
  { name: 'Лес',     ui: { page: '#1e3a2b', container: '#2a4b3a', panel: '#3b5e4b', inner: '#0f1f15', accent: '#7bed9f' } }
];

const DEFAULT_UI_COLORS = {
  page:      { label: 'Фон сайта',   value: '#1a1a2e', alpha: 1 },
  container: { label: 'Контейнер',   value: '#16213e', alpha: 1 },
  panel:     { label: 'Панели',      value: '#0f3460', alpha: 1 },
  inner:     { label: 'Поле',        value: '#0f0f1e', alpha: 1 },
  accent:    { label: 'Акцент',      value: '#4ecdc4', alpha: 1 }
};

let PIECE_COLORS = JSON.parse(JSON.stringify(DEFAULT_PIECE_COLORS));
let UI_COLORS = JSON.parse(JSON.stringify(DEFAULT_UI_COLORS));

let board, current, next, score, lines, level, dropInterval, dropCounter, lastTime, gameOver, rafId;
let backgroundImage = null;
let gameStarted = false;
let isBossPaused = false;
let isPaused = false;

function hexToRgba(hex, alpha) {
  let r = parseInt(hex.slice(1, 3), 16),
      g = parseInt(hex.slice(3, 5), 16),
      b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildThemePresets() {
  themePresetsBox.innerHTML = '';
  THEME_PRESETS.forEach((theme, index) => {
    const btn = document.createElement('div');
    btn.className = 'theme-btn';
    if (index === 0) btn.classList.add('active');
    btn.style.background = `linear-gradient(135deg, ${theme.ui.page} 0%, ${theme.ui.accent} 100%)`;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      Object.keys(theme.ui).forEach(key => {
        UI_COLORS[key].value = theme.ui[key];
        UI_COLORS[key].alpha = 1; // При смене темы сбрасываем прозрачность
      });
      applyUIColors();
      buildUIColorsPanel(); 
      saveSettings();
    });
    themePresetsBox.appendChild(btn);
  });
}

function checkAdmin(nick) {
  if (nick === 'ADM1N') {
    isAdmin = true;
    adminPanel.style.display = 'block';
  } else {
    isAdmin = false;
    adminPanel.style.display = 'none';
  }
}

btnPlay.addEventListener('click', () => {
  const nick = menuNick.value.trim() || 'Игрок';
  nickInput.value = nick;
  localStorage.setItem('tetris-nick', nick);
  checkAdmin(nick);
  mainMenu.classList.add('hidden');
  gameStarted = true;
  btnPlay.blur();
  reset();
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

function togglePause() {
  if (!gameStarted || gameOver) return;
  isPaused = !isPaused;
  
  if (isPaused) {
    pauseBtn.textContent = "Продолжить (P)";
  } else {
    pauseBtn.textContent = "Пауза (P)";
  }
  draw(); 
}

pauseBtn.addEventListener('click', togglePause);

function applyUIColors() {
  const root = document.documentElement;
  root.style.setProperty('--bg-page', hexToRgba(UI_COLORS.page.value, UI_COLORS.page.alpha));
  root.style.setProperty('--bg-container', hexToRgba(UI_COLORS.container.value, UI_COLORS.container.alpha));
  root.style.setProperty('--bg-panel', hexToRgba(UI_COLORS.panel.value, UI_COLORS.panel.alpha));
  root.style.setProperty('--bg-inner', hexToRgba(UI_COLORS.inner.value, UI_COLORS.inner.alpha));
  root.style.setProperty('--accent', hexToRgba(UI_COLORS.accent.value, UI_COLORS.accent.alpha));
}

function saveSettings() {
  try {
    localStorage.setItem('tetris-piece-colors', JSON.stringify(PIECE_COLORS));
    localStorage.setItem('tetris-ui-colors', JSON.stringify(UI_COLORS));
    localStorage.setItem('tetris-speed', JSON.stringify(speedSettings));
    if (backgroundImage && backgroundImage.src) {
      localStorage.setItem('tetris-bg', backgroundImage.src);
    } else {
      localStorage.removeItem('tetris-bg');
    }
  } catch(e) {}
}

function loadSettings() {
  try {
    const pieceRaw = localStorage.getItem('tetris-piece-colors');
    if (pieceRaw) {
      const saved = JSON.parse(pieceRaw);
      Object.keys(saved).forEach(k => {
        if (saved[k]) {
          PIECE_COLORS[k] = typeof saved[k] === 'string' ? { color: saved[k], alpha: 1 } : saved[k];
        }
      });
    }
    
    const uiRaw = localStorage.getItem('tetris-ui-colors');
    if (uiRaw) {
      const saved = JSON.parse(uiRaw);
      Object.keys(saved).forEach(k => {
        if (saved[k]) {
          UI_COLORS[k] = typeof saved[k] === 'string' ? { value: saved[k], alpha: 1 } : saved[k];
        }
      });
    }

    const speedRaw = localStorage.getItem('tetris-speed');
    if (speedRaw) speedSettings = { ...DEFAULT_SPEED, ...JSON.parse(speedRaw) };
    
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
  } catch(e) {}
}

function applyBackgroundToUI(src) {
  if (src) {
    document.body.style.backgroundImage = `url(${src})`;
    document.body.classList.add('has-bg');
  } else {
    document.body.style.backgroundImage = 'none';
    document.body.classList.remove('has-bg');
  }
}

function updateBgStatus() {
  const status = document.getElementById('bg-status');
  if (!status) return;
  status.textContent = backgroundImage ? '✅ Фон загружен' : 'Фон не задан';
}

async function fetchLeaderboard() {
  leaderboardList.innerHTML = '<div style="font-size:11px; color:#9aa; text-align:center;">Загрузка...</div>';
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
        <span class="leader-score">${entry.score}</span>
      `;
      leaderboardList.appendChild(div);
    });
  } catch (err) {
    leaderboardList.innerHTML = `<div style="font-size:11px; color:#e94560; text-align:center; padding: 5px;">Ошибка: ${err.message || 'Нет связи'}</div>`;
  }
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

async function addScoreToLeaderboard(finalScore) {
  if (finalScore <= 0) return;
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
}

document.getElementById('admin-clear').addEventListener('click', () => {
  if (!isAdmin) return;
  board = createBoard(); 
  score += 100;
  updateUI();
  draw();
});

document.getElementById('admin-squares').addEventListener('click', () => {
  if (!isAdmin) return;
  cheatLinesActive = !cheatLinesActive;
  document.getElementById('admin-squares').textContent = cheatLinesActive ? "Выключить линии" : "Только линии (5x2)";
});

document.getElementById('admin-noclip').addEventListener('click', () => {
  if (!isAdmin) return;
  cheatNoclipActive = !cheatNoclipActive;
  document.getElementById('admin-noclip').textContent = cheatNoclipActive ? "Выключить Бога" : "Режим Бога (в стены)";
  document.getElementById('admin-noclip').style.background = cheatNoclipActive ? "#4ecdc4" : "var(--accent)";
});

document.getElementById('admin-apply-score').addEventListener('click', async () => {
  if (!isAdmin) return;
  const target = adminTargetNick.value.trim();
  const scoreVal = parseInt(adminSetScore.value);
  if (!target || isNaN(scoreVal)) return alert("Введи ник и очки!");
  
  const { data } = await db.from('leaderboard').select('score').eq('name', target).maybeSingle();
  if (data) {
    await db.from('leaderboard').update({ score: scoreVal }).eq('name', target);
  } else {
    await db.from('leaderboard').insert({ name: target, score: scoreVal });
  }
  fetchLeaderboard();
  alert(`Очки ${scoreVal} выданы игроку ${target}`);
});

document.getElementById('admin-apply-nick').addEventListener('click', async () => {
  if (!isAdmin) return;
  const target = adminTargetNick.value.trim();
  const newNick = adminNewNick.value.trim();
  if (!target || !newNick) return alert("Введи старый и новый ник!");
  
  await db.from('leaderboard').update({ name: newNick }).eq('name', target);
  fetchLeaderboard();
  alert(`Ник ${target} изменен на ${newNick}`);
});

// === ПАНЕЛЬ ЦВЕТОВ ФИГУР С ПРОЗРАЧНОСТЬЮ ===
const colorsPanel = document.getElementById('colors-panel');
function buildColorsPanel() {
  colorsPanel.innerHTML = '';
  const configurableColors = Object.keys(DEFAULT_PIECE_COLORS).filter(k => k !== 'BOSS');
  
  configurableColors.forEach(type => {
    const item = document.createElement('div');
    item.className = 'color-item';
    
    // Верхняя строка: цвет и название
    const topRow = document.createElement('div');
    topRow.className = 'color-top-row';
    
    const input = document.createElement('input');
    input.type = 'color';
    input.value = PIECE_COLORS[type].color;
    input.addEventListener('input', () => {
      PIECE_COLORS[type].color = input.value;
      saveSettings(); draw(); drawNext();
    });
    
    const label = document.createElement('span');
    label.textContent = type;
    
    topRow.appendChild(input); 
    topRow.appendChild(label);
    
    // Ползунок прозрачности
    const alphaInput = document.createElement('input');
    alphaInput.type = 'range';
    alphaInput.className = 'color-alpha';
    alphaInput.min = '0'; alphaInput.max = '1'; alphaInput.step = '0.05';
    alphaInput.value = PIECE_COLORS[type].alpha;
    alphaInput.addEventListener('input', () => {
      PIECE_COLORS[type].alpha = parseFloat(alphaInput.value);
      saveSettings(); draw(); drawNext();
    });

    item.appendChild(topRow);
    item.appendChild(alphaInput);
    colorsPanel.appendChild(item);
  });
}

// === ПАНЕЛЬ ЦВЕТОВ ИНТЕРФЕЙСА С ПРОЗРАЧНОСТЬЮ ===
const uiColorsPanel = document.getElementById('ui-colors-panel');
function buildUIColorsPanel() {
  uiColorsPanel.innerHTML = '';
  Object.keys(DEFAULT_UI_COLORS).forEach(key => {
    const item = document.createElement('div');
    item.className = 'color-item';
    
    const topRow = document.createElement('div');
    topRow.className = 'color-top-row';
    
    const input = document.createElement('input');
    input.type = 'color';
    input.value = UI_COLORS[key].value;
    input.addEventListener('input', () => {
      UI_COLORS[key].value = input.value;
      applyUIColors(); saveSettings(); draw();
    });
    
    const label = document.createElement('span');
    label.textContent = DEFAULT_UI_COLORS[key].label;
    
    topRow.appendChild(input); 
    topRow.appendChild(label);
    
    const alphaInput = document.createElement('input');
    alphaInput.type = 'range';
    alphaInput.className = 'color-alpha';
    alphaInput.min = '0'; alphaInput.max = '1'; alphaInput.step = '0.05';
    alphaInput.value = UI_COLORS[key].alpha;
    alphaInput.addEventListener('input', () => {
      UI_COLORS[key].alpha = parseFloat(alphaInput.value);
      applyUIColors(); saveSettings(); draw();
    });

    item.appendChild(topRow);
    item.appendChild(alphaInput);
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

setStartSpeed.addEventListener('input', () => { speedSettings.start = parseInt(setStartSpeed.value); valStart.textContent = speedSettings.start; if (!gameOver && gameStarted) dropInterval = recalcSpeed(); saveSettings(); });
setSpeedStep.addEventListener('input', () => { speedSettings.step = parseInt(setSpeedStep.value); valStep.textContent = speedSettings.step; if (!gameOver && gameStarted) dropInterval = recalcSpeed(); saveSettings(); });
setMinSpeed.addEventListener('input', () => { speedSettings.min = parseInt(setMinSpeed.value); valMin.textContent = speedSettings.min; if (!gameOver && gameStarted) dropInterval = recalcSpeed(); saveSettings(); });

document.getElementById('bg-upload').addEventListener('change', (e) => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
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
  reader.readAsDataURL(file); e.target.value = '';
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
  PIECE_COLORS = JSON.parse(JSON.stringify(DEFAULT_PIECE_COLORS));
  UI_COLORS = JSON.parse(JSON.stringify(DEFAULT_UI_COLORS));
  speedSettings = { ...DEFAULT_SPEED };
  backgroundImage = null;
  applyBackgroundToUI(null);
  applyUIColors(); updateBgStatus(); buildColorsPanel(); buildUIColorsPanel(); updateSpeedUI();
  saveSettings(); if (gameStarted) reset();
});

function createBoard() { return Array.from({length: ROWS}, () => Array(COLS).fill(null)); }

function newPiece() {
  if (cheatLinesActive) {
    const lineMatrix = [ [1,1,1,1,1], [1,1,1,1,1] ];
    return { type: 'RAINBOW', matrix: lineMatrix, x: Math.floor((COLS - 5) / 2), y: 0 };
  }

  if (isBossActive) {
    const keys = Object.keys(BOSS_SHAPES);
    const type = keys[Math.floor(Math.random() * keys.length)];
    return { 
      type: 'BOSS', 
      matrix: BOSS_SHAPES[type].map(r => [...r]), 
      x: Math.floor((COLS - BOSS_SHAPES[type][0].length) / 2), 
      y: 0 
    };
  }

  const keys = Object.keys(SHAPES);
  const type = keys[Math.floor(Math.random() * keys.length)];
  return { type, matrix: SHAPES[type].map(r => [...r]), x: Math.floor((COLS - SHAPES[type][0].length) / 2), y: 0 };
}

function rotate(matrix) {
  const N = matrix.length, M = matrix[0].length;
  const result = Array.from({length: M}, () => Array(N).fill(0));
  for (let y = 0; y < N; y++) for (let x = 0; x < M; x++) result[x][N - 1 - y] = matrix[y][x];
  return result;
}

function collide(board, piece) {
  for (let y = 0; y < piece.matrix.length; y++) {
    for (let x = 0; x < piece.matrix[y].length; x++) {
      if (!piece.matrix[y][x]) continue;
      const py = piece.y + y, px = piece.x + x;
      
      if (py >= ROWS) return true;

      if (cheatNoclipActive) {
        if (px < 0 || px >= COLS) return true; 
        continue; 
      }

      if (px < 0 || px >= COLS) return true;
      if (py >= 0 && board[py][px]) return true;
    }
  }
  return false;
}

function getGhostY() {
  const ghost = { ...current, matrix: current.matrix };
  while (!collide(board, { ...ghost, y: ghost.y + 1 })) ghost.y++;
  return ghost.y;
}

function merge(board, piece) {
  piece.matrix.forEach((row, y) => {
    row.forEach((v, x) => { 
      if (v && piece.y + y >= 0 && piece.y + y < ROWS && piece.x + x >= 0 && piece.x + x < COLS) {
        board[piece.y + y][piece.x + x] = piece.type; 
      }
    });
  });
}

function updateBossUI() {
  const percent = Math.max(0, (bossHP / BOSS_MAX_HP) * 100);
  bossHpFillModal.style.width = percent + '%';
  bossHpTextModal.textContent = `${Math.max(0, bossHP)} / ${BOSS_MAX_HP}`;
  bossHpFillBar.style.width = percent + '%';
  bossHpTextBar.textContent = `${Math.max(0, bossHP)}/${BOSS_MAX_HP}`;
}

function startBossFight() {
  bossHP = BOSS_MAX_HP;
  isBossActive = true;
  isBossPaused = false;
  bossModal.classList.add('hidden');
  bossBar.classList.remove('hidden'); 
  updateBossUI();
  
  board = createBoard();
  
  const keys = Object.keys(BOSS_SHAPES);
  const type = keys[Math.floor(Math.random() * keys.length)];
  next = { 
    type: 'BOSS', 
    matrix: BOSS_SHAPES[type].map(r => [...r]), 
    x: Math.floor((COLS - BOSS_SHAPES[type][0].length) / 2), 
    y: 0 
  };
  
  drawNext();
  recalcSpeed();
  updateUI();
  draw(); 
}

function triggerBoss() {
  isBossActive = true;
  isBossPaused = true;
  bossHP = BOSS_MAX_HP;
  updateBossUI();
  bossModal.classList.remove('hidden');
}

function clearLines() {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every(cell => cell)) { board.splice(y, 1); board.unshift(Array(COLS).fill(null)); cleared++; y++; }
  }
  if (cleared) {
    const points = [0, 100, 300, 500, 800];
    score += points[cleared] * level;
    lines += cleared;

    if (isBossActive) {
      bossHP -= cleared * 15;
      updateBossUI();
      if (bossHP <= 0) {
        isBossActive = false;
        board = createBoard(); 
        bossBar.classList.add('hidden'); 
        bossScoreTarget = score + NEXT_BOSS_TRIGGER; 
        alert("🎉 БОСС ПОВЕРЖЕН! Поле очищено. Следующий через 25 000 очков.");
        recalcSpeed();
        updateUI();
        draw();
      }
    }

    if (!isBossActive && score >= bossScoreTarget) {
      triggerBoss();
    }

    const newLevel = Math.floor(lines / LINES_PER_LEVEL) + 1;
    if (newLevel !== level) level = newLevel;
    dropInterval = recalcSpeed();
    updateUI();
  }
}

function recalcSpeed() {
  if (!dropInterval) dropInterval = speedSettings.start;
  const progress = (lines % LINES_PER_LEVEL) / LINES_PER_LEVEL;
  const targetSpeed = Math.max(speedSettings.min, speedSettings.start - (level - 1) * speedSettings.step);
  return Math.max(speedSettings.min, targetSpeed * (1 - progress * 0.25));
}

function updateUI() {
  scoreEl.textContent = score; linesEl.textContent = lines; levelEl.textContent = level;
  const pct = Math.round((speedSettings.start / dropInterval) * 100);
  speedEl.textContent = pct + '%';
}

function drawBlock(c, x, y, colorData, size = BLOCK, alphaOverride = null, isRainbow = false) {
  c.save(); 
  
  // Берем либо переопределенную прозрачность (для призрака), либо из настроек
  const finalAlpha = alphaOverride !== null ? alphaOverride : colorData.alpha;

  if (isRainbow) {
    c.fillStyle = `hsla(${(rainbowTime * 0.1) % 360}, 100%, 50%, ${finalAlpha})`;
  } else {
    c.fillStyle = hexToRgba(colorData.color, finalAlpha);
  }
  
  c.fillRect(x * size, y * size, size, size);
  
  // Рамка и блик только если блок не совсем прозрачный
  if (finalAlpha > 0.1) {
    c.strokeStyle = `rgba(0,0,0,${0.4 * finalAlpha})`; 
    c.strokeRect(x * size, y * size, size, size);
    c.fillStyle = `rgba(255,255,255,${0.15 * finalAlpha})`; 
    c.fillRect(x * size + 3, y * size + 3, size - 6, 4);
  }
  
  c.restore();
}

function drawGhostBlock(c, x, y, colorData, size = BLOCK, isRainbow = false) {
  const px = x * size, py = y * size;
  c.save(); 
  
  const ghostAlpha = colorData.alpha * 0.4; // Призрак всегда прозрачнее оригинала
  
  c.fillStyle = isRainbow ? `hsla(${(rainbowTime * 0.1) % 360}, 100%, 50%, ${ghostAlpha})` : hexToRgba(colorData.color, ghostAlpha); 
  c.fillRect(px, py, size, size);
  
  if (ghostAlpha > 0.1) {
    c.globalAlpha = 1; c.strokeStyle = colorData.color; c.lineWidth = 2; c.strokeRect(px + 1, py + 1, size - 2, size - 2);
    c.globalAlpha = 0.6; c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(px + 4, py + 4, size - 8, 3);
  }
  c.restore();
}

function draw() {
  if (!board) return; 
  if (backgroundImage) {
    const imgRatio = backgroundImage.width / backgroundImage.height;
    const canvasRatio = canvas.width / canvas.height;
    let sx = 0, sy = 0, sw = backgroundImage.width, sh = backgroundImage.height;
    if (imgRatio > canvasRatio) { sw = backgroundImage.height * canvasRatio; sx = (backgroundImage.width - sw) / 2; }
    else { sh = backgroundImage.width / canvasRatio; sy = (backgroundImage.height - sh) / 2; }
    ctx.drawImage(backgroundImage, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(15, 15, 30, 0.55)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = hexToRgba(UI_COLORS.inner.value, UI_COLORS.inner.alpha); 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (isBossActive) {
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    ctx.lineWidth = 1;
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * BLOCK, 0); ctx.lineTo(x * BLOCK, canvas.height); ctx.stroke(); }
  for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * BLOCK); ctx.lineTo(canvas.width, y * BLOCK); ctx.stroke(); }

  board.forEach((row, y) => row.forEach((type, x) => { 
    if (type) drawBlock(ctx, x, y, PIECE_COLORS[type] || PIECE_COLORS.BOSS, BLOCK, null, type === 'RAINBOW'); 
  }));

  if (current) {
    const ghostY = getGhostY();
    if (ghostY > current.y) {
      current.matrix.forEach((row, y) => row.forEach((v, x) => {
        if (v) drawGhostBlock(ctx, current.x + x, ghostY + y, PIECE_COLORS[current.type] || PIECE_COLORS.BOSS, BLOCK, current.type === 'RAINBOW');
      }));
    }
    current.matrix.forEach((row, y) => row.forEach((v, x) => {
      if (v) drawBlock(ctx, current.x + x, current.y + y, PIECE_COLORS[current.type] || PIECE_COLORS.BOSS, BLOCK, null, current.type === 'RAINBOW');
    }));
  }

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e94560'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
  } else if (isPaused) {
    ctx.fillStyle = 'rgba(15, 15, 30, 0.8)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#4ecdc4'; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('ПАУЗА', canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = '#9aa'; ctx.font = '16px sans-serif';
    ctx.fillText('Нажмите P чтобы продолжить', canvas.width / 2, canvas.height / 2 + 30);
  }
}

function drawNext() {
  nctx.fillStyle = hexToRgba(UI_COLORS.inner.value, UI_COLORS.inner.alpha); 
  nctx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  if (!next) return;
  const size = 24, m = next.matrix;
  const offX = (nextCanvas.width - m[0].length * size) / 2;
  const offY = (nextCanvas.height - m.length * size) / 2;
  nctx.save(); nctx.translate(offX, offY);
  m.forEach((row, y) => row.forEach((v, x) => {
    if (v) {
      const typeData = PIECE_COLORS[next.type] || PIECE_COLORS.BOSS;
      if (next.type === 'RAINBOW') {
        nctx.fillStyle = `hsl(${(rainbowTime * 0.1) % 360}, 100%, 50%)`;
      } else {
        nctx.fillStyle = hexToRgba(typeData.color, typeData.alpha); 
      }
      nctx.fillRect(x * size, y * size, size, size);
      nctx.strokeStyle = 'rgba(0,0,0,0.4)'; nctx.strokeRect(x * size, y * size, size, size);
    }
  }));
  nctx.restore();
}

function drop() {
  if (!gameStarted || isBossPaused || isPaused) return;
  current.y++;
  if (collide(board, current)) { current.y--; merge(board, current); clearLines(); spawn(); }
  dropCounter = 0;
}

function hardDrop() {
  if (!gameStarted || isBossPaused || isPaused) return;
  while (!collide(board, current)) current.y++;
  current.y--; merge(board, current); clearLines(); spawn();
  dropCounter = 0;
}

function spawn() {
  current = next; 
  next = newPiece();
  if (collide(board, current)) { gameOver = true; addScoreToLeaderboard(score); }
  drawNext();
}

function move(dir) { if (gameStarted && !isBossPaused && !isPaused) { current.x += dir; if (collide(board, current)) current.x -= dir; } }

function playerRotate() {
  if (!gameStarted || isBossPaused || isPaused) return;
  
  const oldMatrix = current.matrix;
  const rotatedMatrix = rotate(current.matrix);
  
  current.matrix = rotatedMatrix;
  if (!collide(board, current)) return;

  let offset = 1;
  while (offset <= Math.max(oldMatrix.length, oldMatrix[0].length)) {
    current.x += offset;
    if (!collide(board, current)) return;

    current.x -= offset * 2;
    if (!collide(board, current)) return;

    current.x += offset;
    offset++;
  }

  current.matrix = oldMatrix;
}

function update(time = 0) {
  if (!gameStarted) return;
  if (gameOver) { draw(); return; }
  
  if (isBossPaused || isPaused) {
    draw();
    rafId = requestAnimationFrame(update);
    lastTime = time; 
    return;
  }

  const delta = time - lastTime; lastTime = time; dropCounter += delta;
  
  rainbowTime += delta;

  if (dropCounter > dropInterval) drop();
  draw(); rafId = requestAnimationFrame(update);
}

function reset() {
  if (rafId) cancelAnimationFrame(rafId);
  board = createBoard(); score = 0; lines = 0; level = 1;
  dropInterval = speedSettings.start;
  dropCounter = 0; lastTime = 0; gameOver = false;
  
  bossScoreTarget = FIRST_BOSS_TRIGGER;
  isBossActive = false;
  isBossPaused = false;
  isPaused = false;
  pauseBtn.textContent = "Пауза (P)";
  bossModal.classList.add('hidden');
  bossBar.classList.add('hidden');
  
  next = newPiece(); spawn(); updateUI(); update();
}

btnStartBoss.addEventListener('click', () => {
  startBossFight();
});

document.addEventListener('keydown', e => {
  if (document.activeElement === nickInput || document.activeElement === menuNick || document.activeElement === adminTargetNick || document.activeElement === adminSetScore || document.activeElement === adminNewNick) return;
  if (!gameStarted || gameOver) return;
  
  if (isAdmin) {
    if (e.key === 'q' || e.key === 'Q' || e.key === 'й' || e.key === 'Й') {
      board.pop();
      board.unshift(Array(COLS).fill(null));
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
      cheatLinesActive = !cheatLinesActive;
      document.getElementById('admin-squares').textContent = cheatLinesActive ? "Выключить линии" : "Только линии (5x2)";
      return;
    }
    if (e.key === 'r' || e.key === 'R' || e.key === 'к' || e.key === 'К') {
      cheatNoclipActive = !cheatNoclipActive;
      document.getElementById('admin-noclip').textContent = cheatNoclipActive ? "Выключить Бога" : "Режим Бога (в стены)";
      document.getElementById('admin-noclip').style.background = cheatNoclipActive ? "#4ecdc4" : "var(--accent)";
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
  else if (e.key === 'ArrowDown') { drop(); }
  else if (e.key === 'ArrowUp') playerRotate();
  else if (e.key === ' ') { e.preventDefault(); hardDrop(); }
  if (['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' '].includes(e.key)) e.preventDefault();
});

document.getElementById('mob-left').addEventListener('click', () => { move(-1); });
document.getElementById('mob-right').addEventListener('click', () => { move(1); });
document.getElementById('mob-rotate').addEventListener('click', () => { playerRotate(); });
document.getElementById('mob-down').addEventListener('click', () => { drop(); });
document.getElementById('mob-drop').addEventListener('click', () => { hardDrop(); });

const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
if (!isTouchDevice) {
  const mobControls = document.getElementById('mobile-controls');
  if (mobControls) mobControls.style.display = 'none';
}

restartBtn.addEventListener('click', () => { if (gameStarted) reset(); });

loadSettings();
applyUIColors();
buildThemePresets();
buildColorsPanel();
buildUIColorsPanel();
updateSpeedUI();
updateBgStatus();
fetchLeaderboard(); 
draw();