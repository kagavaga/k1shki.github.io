const SUPABASE_URL = 'https://mzqgdpygxxddsfyjiaxk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7B-N_d0iNJJzT_0VfZxN_w_lBuo5zLD';

const db = window.supabase.createClient(SUPABASE_URL.trim(), SUPABASE_ANON_KEY.trim());

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;
const LINES_PER_LEVEL = 8;
const DEFAULT_SPEED = { start: 800, step: 55, min: 90 };
let speedSettings = { ...DEFAULT_SPEED };

// === НАСТРОЙКИ БОССА ===
const BOSS_TRIGGER_SCORE = 2500; 
const BOSS_MAX_HP = 100;
const BOSS_SPEED_MULTIPLIER = 3; // Ускорение в 3 раза

let bossScoreTarget = BOSS_TRIGGER_SCORE;
let bossHP = BOSS_MAX_HP;
let isBossActive = false;

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nctx = nextCanvas.getContext('2d');

const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const speedEl = document.getElementById('speed');
const restartBtn = document.getElementById('restart');

// Элементы Босса
const bossModal = document.getElementById('boss-modal');
const bossHpFill = document.getElementById('boss-hp-fill');
const bossHpText = document.getElementById('boss-hp-text');
const btnStartBoss = document.getElementById('btn-start-boss');

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

const DEFAULT_PIECE_COLORS = {
  I: '#4ecdc4', O: '#ffe66d', T: '#c44dff',
  S: '#4dff88', Z: '#ff4d6d', J: '#4d7cff', L: '#ffa94d'
};

const THEME_PRESETS = [
  { name: 'Космос',  ui: { page: '#1a1a2e', container: '#16213e', panel: '#0f3460', inner: '#0f0f1e', accent: '#4ecdc4' } },
  { name: 'Тьма',    ui: { page: '#000000', container: '#111111', panel: '#222222', inner: '#000000', accent: '#e94560' } },
  { name: 'Неон',    ui: { page: '#0d0221', container: '#0f084b', panel: '#261447', inner: '#000000', accent: '#ff00ff' } },
  { name: 'Лес',     ui: { page: '#1e3a2b', container: '#2a4b3a', panel: '#3b5e4b', inner: '#0f1f15', accent: '#7bed9f' } }
];

const DEFAULT_UI_COLORS = {
  page:      { label: 'Фон сайта',   value: THEME_PRESETS[0].ui.page },
  container: { label: 'Контейнер',   value: THEME_PRESETS[0].ui.container },
  panel:     { label: 'Панели',      value: THEME_PRESETS[0].ui.panel },
  inner:     { label: 'Поле',        value: THEME_PRESETS[0].ui.inner },
  accent:    { label: 'Акцент',      value: THEME_PRESETS[0].ui.accent }
};

let PIECE_COLORS = { ...DEFAULT_PIECE_COLORS };
let UI_COLORS = {};
Object.keys(DEFAULT_UI_COLORS).forEach(k => UI_COLORS[k] = DEFAULT_UI_COLORS[k].value);

let board, current, next, score, lines, level, dropInterval, dropCounter, lastTime, gameOver, rafId;
let backgroundImage = null;
let gameStarted = false;
let isBossPaused = false; // Флаг для паузы перед боссом

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
      Object.keys(theme.ui).forEach(key => UI_COLORS[key] = theme.ui[key]);
      applyUIColors();
      buildUIColorsPanel(); 
      saveSettings();
    });
    themePresetsBox.appendChild(btn);
  });
}

btnPlay.addEventListener('click', () => {
  const nick = menuNick.value.trim() || 'Игрок';
  nickInput.value = nick;
  localStorage.setItem('tetris-nick', nick);
  mainMenu.classList.add('hidden');
  gameStarted = true;
  btnPlay.blur();
  reset();
});

function applyUIColors() {
  const root = document.documentElement;
  root.style.setProperty('--bg-page', UI_COLORS.page);
  root.style.setProperty('--bg-container', UI_COLORS.container);
  root.style.setProperty('--bg-panel', UI_COLORS.panel);
  root.style.setProperty('--bg-inner', UI_COLORS.inner);
  root.style.setProperty('--accent', UI_COLORS.accent);
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
    if (pieceRaw) PIECE_COLORS = { ...DEFAULT_PIECE_COLORS, ...JSON.parse(pieceRaw) };
    const uiRaw = localStorage.getItem('tetris-ui-colors');
    if (uiRaw) UI_COLORS = { ...UI_COLORS, ...JSON.parse(uiRaw) };
    const speedRaw = localStorage.getItem('tetris-speed');
    if (speedRaw) speedSettings = { ...DEFAULT_SPEED, ...JSON.parse(speedRaw) };
    const bgRaw = localStorage.getItem('tetris-bg');
    if (bgRaw) {
      const img = new Image();
      img.onload = () => { backgroundImage = img; updateBgStatus(); draw(); };
      img.onerror = () => localStorage.removeItem('tetris-bg');
      img.src = bgRaw;
    }
    const savedNick = localStorage.getItem('tetris-nick');
    if (savedNick) {
      menuNick.value = savedNick;
      nickInput.value = savedNick;
    }
  } catch(e) {}
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

document.getElementById('leaderboard-reset').addEventListener('click', async () => {
  if (!confirm('Очистить таблицу лидеров?')) return;
  await db.from('leaderboard').delete().neq('id', 0); 
  await fetchLeaderboard();
});

const colorsPanel = document.getElementById('colors-panel');
function buildColorsPanel() {
  colorsPanel.innerHTML = '';
  Object.keys(DEFAULT_PIECE_COLORS).forEach(type => {
    const item = document.createElement('div');
    item.className = 'color-item';
    const input = document.createElement('input');
    input.type = 'color';
    input.value = PIECE_COLORS[type];
    input.addEventListener('input', () => {
      PIECE_COLORS[type] = input.value;
      saveSettings(); draw(); drawNext();
    });
    const label = document.createElement('span');
    label.textContent = type;
    item.appendChild(input); item.appendChild(label);
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
      applyUIColors(); saveSettings(); draw();
    });
    const label = document.createElement('span');
    label.textContent = DEFAULT_UI_COLORS[key].label;
    item.appendChild(input); item.appendChild(label);
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
    img.onload = () => { backgroundImage = img; updateBgStatus(); saveSettings(); draw(); };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file); e.target.value = '';
});

document.getElementById('bg-reset').addEventListener('click', () => { backgroundImage = null; updateBgStatus(); saveSettings(); draw(); });

document.getElementById('settings-reset').addEventListener('click', () => {
  if (!confirm('Сбросить все настройки?')) return;
  PIECE_COLORS = { ...DEFAULT_PIECE_COLORS };
  Object.keys(DEFAULT_UI_COLORS).forEach(k => UI_COLORS[k] = DEFAULT_UI_COLORS[k].value);
  speedSettings = { ...DEFAULT_SPEED };
  backgroundImage = null;
  applyUIColors(); updateBgStatus(); buildColorsPanel(); buildUIColorsPanel(); updateSpeedUI();
  saveSettings(); if (gameStarted) reset();
});

function createBoard() { return Array.from({length: ROWS}, () => Array(COLS).fill(null)); }
function newPiece() {
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
      if (px < 0 || px >= COLS || py >= ROWS) return true;
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
    row.forEach((v, x) => { if (v && piece.y + y >= 0) board[piece.y + y][piece.x + x] = piece.type; });
  });
}

// === ЛОГИКА БОССА ===
function updateBossUI() {
  const percent = Math.max(0, (bossHP / BOSS_MAX_HP) * 100);
  bossHpFill.style.width = percent + '%';
  bossHpText.textContent = `${Math.max(0, bossHP)} / ${BOSS_MAX_HP}`;
}

function startBossFight() {
  bossHP = BOSS_MAX_HP;
  isBossActive = true;
  isBossPaused = false;
  bossModal.classList.add('hidden');
  updateBossUI();
  recalcSpeed();
  updateUI();
}

// === ОЧИСТКА ЛИНИЙ (С УРОНОМ БОССУ) ===
function clearLines() {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every(cell => cell)) { board.splice(y, 1); board.unshift(Array(COLS).fill(null)); cleared++; y++; }
  }
  if (cleared) {
    const points = [0, 100, 300, 500, 800];
    score += points[cleared] * level;
    lines += cleared;

    // Наносим урон боссу
    if (isBossActive) {
      bossHP -= cleared * 10; // Каждая линия = 10 урона
      updateBossUI();
      
      if (bossHP <= 0) {
        // Босс повержен!
        isBossActive = false;
        bossScoreTarget += BOSS_TRIGGER_SCORE; // Следующий босс через 2500 очков
        alert("🎉 БОСС ПОВЕРЖЕН! Вы получаете передышку.");
        recalcSpeed();
        updateUI();
      }
    } else {
      // Проверяем, не пора ли вызвать босса
      if (score >= bossScoreTarget) {
        isBossActive = true;
        isBossPaused = true;
        bossHP = BOSS_MAX_HP;
        updateBossUI();
        bossModal.classList.remove('hidden');
        return; // Прерываем, ждем кнопки "В бой"
      }
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
  let base = Math.max(speedSettings.min, targetSpeed * (1 - progress * 0.25));
  
  // Если босс активен — ускоряем
  if (isBossActive) {
    base = base / BOSS_SPEED_MULTIPLIER;
  }
  return Math.max(speedSettings.min, base);
}

function updateUI() {
  scoreEl.textContent = score; linesEl.textContent = lines; levelEl.textContent = level;
  const pct = Math.round((speedSettings.start / dropInterval) * 100);
  speedEl.textContent = pct + '%';
}

// ... (функции drawBlock, drawGhostBlock, draw, drawNext остаются без изменений) ...
function drawBlock(c, x, y, color, size = BLOCK, alpha = 1) {
  c.save(); c.globalAlpha = alpha; c.fillStyle = color;
  c.fillRect(x * size, y * size, size, size);
  c.strokeStyle = 'rgba(0,0,0,0.4)'; c.strokeRect(x * size, y * size, size, size);
  c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(x * size + 3, y * size + 3, size - 6, 4);
  c.restore();
}

function drawGhostBlock(c, x, y, color, size = BLOCK) {
  const px = x * size, py = y * size;
  c.save(); c.globalAlpha = 0.45; c.fillStyle = color; c.fillRect(px, py, size, size);
  c.globalAlpha = 1; c.strokeStyle = color; c.lineWidth = 2; c.strokeRect(px + 1, py + 1, size - 2, size - 2);
  c.globalAlpha = 0.6; c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(px + 4, py + 4, size - 8, 3);
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
    ctx.fillStyle = UI_COLORS.inner; ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Если босс активен, рисуем красную рамку вокруг поля
  if (isBossActive) {
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    ctx.lineWidth = 1;
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * BLOCK, 0); ctx.lineTo(x * BLOCK, canvas.height); ctx.stroke(); }
  for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * BLOCK); ctx.lineTo(canvas.width, y * BLOCK); ctx.stroke(); }

  board.forEach((row, y) => row.forEach((type, x) => { if (type) drawBlock(ctx, x, y, PIECE_COLORS[type]); }));

  if (current) {
    const ghostY = getGhostY();
    if (ghostY > current.y) {
      current.matrix.forEach((row, y) => row.forEach((v, x) => {
        if (v) drawGhostBlock(ctx, current.x + x, ghostY + y, PIECE_COLORS[current.type]);
      }));
    }
    current.matrix.forEach((row, y) => row.forEach((v, x) => {
      if (v) drawBlock(ctx, current.x + x, current.y + y, PIECE_COLORS[current.type]);
    }));
  }

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e94560'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
  }
}

function drawNext() {
  nctx.fillStyle = UI_COLORS.inner; nctx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  if (!next) return;
  const size = 24, m = next.matrix;
  const offX = (nextCanvas.width - m[0].length * size) / 2;
  const offY = (nextCanvas.height - m.length * size) / 2;
  nctx.save(); nctx.translate(offX, offY);
  m.forEach((row, y) => row.forEach((v, x) => {
    if (v) {
      nctx.fillStyle = PIECE_COLORS[next.type]; nctx.fillRect(x * size, y * size, size, size);
      nctx.strokeStyle = 'rgba(0,0,0,0.4)'; nctx.strokeRect(x * size, y * size, size, size);
    }
  }));
  nctx.restore();
}

// === УПРАВЛЕНИЕ (БЛОКИРУЕМ ПРИ ПАУЗЕ БОССА) ===
function drop() {
  if (!gameStarted || isBossPaused) return;
  current.y++;
  if (collide(board, current)) { current.y--; merge(board, current); clearLines(); spawn(); }
  dropCounter = 0;
}

function hardDrop() {
  if (!gameStarted || isBossPaused) return;
  while (!collide(board, current)) current.y++;
  current.y--; merge(board, current); clearLines(); spawn();
  dropCounter = 0;
}

function spawn() {
  current = next; next = newPiece();
  if (collide(board, current)) { gameOver = true; addScoreToLeaderboard(score); }
  drawNext();
}

function move(dir) { if (gameStarted && !isBossPaused) { current.x += dir; if (collide(board, current)) current.x -= dir; } }

function playerRotate() {
  if (!gameStarted || isBossPaused) return;
  const rotated = rotate(current.matrix);
  const old = current.matrix;
  current.matrix = rotated;
  let offset = 1;
  while (collide(board, current)) {
    current.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > rotated[0].length) { current.matrix = old; return; }
  }
}

function update(time = 0) {
  if (!gameStarted) return;
  if (gameOver) { draw(); return; }
  
  // Если пауза перед боссом, просто рисуем и ждем
  if (isBossPaused) {
    draw();
    rafId = requestAnimationFrame(update);
    lastTime = time; // сбрасываем таймер, чтобы фигура не упала сразу после паузы
    return;
  }

  const delta = time - lastTime; lastTime = time; dropCounter += delta;
  if (dropCounter > dropInterval) drop();
  draw(); rafId = requestAnimationFrame(update);
}

function reset() {
  if (rafId) cancelAnimationFrame(rafId);
  board = createBoard(); score = 0; lines = 0; level = 1;
  dropInterval = speedSettings.start;
  dropCounter = 0; lastTime = 0; gameOver = false;
  
  // Сброс босса
  bossScoreTarget = BOSS_TRIGGER_SCORE;
  isBossActive = false;
  isBossPaused = false;
  bossModal.classList.add('hidden');
  
  next = newPiece(); spawn(); updateUI(); update();
}

// Кнопка старта боя с боссом
btnStartBoss.addEventListener('click', () => {
  startBossFight();
});

document.addEventListener('keydown', e => {
  if (document.activeElement === nickInput || document.activeElement === menuNick) return;
  if (!gameStarted || gameOver) return;
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
nickInput.addEventListener('input', () => {
  localStorage.setItem('tetris-nick', nickInput.value.trim());
  if (menuNick.value !== nickInput.value) menuNick.value = nickInput.value;
});
menuNick.addEventListener('input', () => {
  localStorage.setItem('tetris-nick', menuNick.value.trim());
  if (nickInput.value !== menuNick.value) nickInput.value = menuNick.value;
});

loadSettings();
applyUIColors();
buildThemePresets();
buildColorsPanel();
buildUIColorsPanel();
updateSpeedUI();
updateBgStatus();
fetchLeaderboard(); 
draw(); 