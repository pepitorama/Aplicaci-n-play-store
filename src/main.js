import {
  ENEMY_TYPES,
  GRID,
  PATH,
  TOWER_TYPES,
  applyReward,
  canPlaceTower,
  cellToPoint,
  createGameState,
  getUpgradeCost,
  isPathCell,
  placeTower,
  previewWave,
  startNextWave,
  towerAt,
  updateGame,
  upgradeTower
} from "./gameLogic.js";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");
const hud = {
  money: document.querySelector("#money"),
  lives: document.querySelector("#lives"),
  wave: document.querySelector("#wave"),
  score: document.querySelector("#score"),
  message: document.querySelector("#message"),
  preview: document.querySelector("#wave-preview"),
  towerCards: document.querySelector("#tower-cards"),
  startWave: document.querySelector("#start-wave"),
  restart: document.querySelector("#restart"),
  rewardPanel: document.querySelector("#reward-panel"),
  rewardCards: document.querySelector("#reward-cards"),
  selectedInfo: document.querySelector("#selected-info")
};

canvas.width = GRID.cols * GRID.cellSize;
canvas.height = GRID.rows * GRID.cellSize;

let state = createGameState();
let selectedTowerId = null;
let lastTimestamp = 0;
let rewardPendingForWave = 0;

renderTowerCards();
bindEvents();
requestAnimationFrame(loop);

function bindEvents() {
  hud.startWave.addEventListener("click", () => {
    hideRewardPanel();
    startNextWave(state);
    renderHud();
  });

  hud.restart.addEventListener("click", () => {
    state = createGameState();
    selectedTowerId = null;
    rewardPendingForWave = 0;
    hideRewardPanel();
    renderTowerCards();
    renderHud();
  });

  canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const col = Math.floor((event.clientX - rect.left) / GRID.cellSize);
    const row = Math.floor((event.clientY - rect.top) / GRID.cellSize);
    const tower = towerAt(state, col, row);

    if (tower) {
      selectedTowerId = tower.id;
      if (!upgradeTower(state, tower.id)) {
        state.message = `${TOWER_TYPES[tower.typeId].name} nivel ${tower.level}. Upgrade: ${getUpgradeCost(tower)} energia.`;
      }
    } else {
      selectedTowerId = null;
      if (!placeTower(state, col, row)) {
        state.message = placementMessage(col, row);
      }
    }
    renderHud();
  });

  document.addEventListener("keydown", (event) => {
    const towerIds = Object.keys(TOWER_TYPES);
    if (event.key >= "1" && event.key <= String(towerIds.length)) {
      state.selectedTowerType = towerIds[Number(event.key) - 1];
      renderTowerCards();
      renderHud();
    }

    if (event.code === "Space") {
      event.preventDefault();
      if (!state.activeWave) {
        hideRewardPanel();
        startNextWave(state);
      }
      renderHud();
    }
  });
}

function loop(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
  }

  const deltaSeconds = Math.min(0.05, (timestamp - lastTimestamp) / 1000);
  lastTimestamp = timestamp;
  const wasActive = state.activeWave;

  updateGame(state, deltaSeconds);

  if (wasActive && !state.activeWave && state.wave > 0 && rewardPendingForWave !== state.wave) {
    rewardPendingForWave = state.wave;
    showRewardPanel();
  }

  draw();
  renderHud();
  requestAnimationFrame(loop);
}

function renderTowerCards() {
  hud.towerCards.innerHTML = "";
  Object.values(TOWER_TYPES).forEach((tower, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `tower-card ${state.selectedTowerType === tower.id ? "selected" : ""}`;
    button.innerHTML = `
      <span class="tower-chip" style="--tower-color:${tower.color}">${tower.shortName}</span>
      <span class="tower-name">${tower.name}</span>
      <span class="tower-cost">${tower.cost} energia</span>
      <small>${tower.description}</small>
      <kbd>${index + 1}</kbd>
    `;
    button.addEventListener("click", () => {
      state.selectedTowerType = tower.id;
      renderTowerCards();
      renderHud();
    });
    hud.towerCards.append(button);
  });
}

function renderHud() {
  hud.money.textContent = state.money;
  hud.lives.textContent = state.lives;
  hud.wave.textContent = state.wave;
  hud.score.textContent = state.score;
  hud.message.textContent = state.message;
  hud.startWave.disabled = state.activeWave || state.enemies.length > 0 || state.lives <= 0;
  hud.preview.innerHTML = previewHtml();

  const selected = state.towers.find((tower) => tower.id === selectedTowerId);
  if (selected) {
    hud.selectedInfo.textContent = `${TOWER_TYPES[selected.typeId].name} nivel ${selected.level}. Upgrade: ${getUpgradeCost(selected)} energia.`;
  } else {
    const tower = TOWER_TYPES[state.selectedTowerType];
    hud.selectedInfo.textContent = `Colocando ${tower.name}. Click en casilla libre; click en una torre para mejorar.`;
  }
}

function previewHtml() {
  const nextWave = state.activeWave ? state.wave : state.wave + 1;
  return Object.entries(previewWave(nextWave, state.lastWaveLeaks))
    .map(([typeId, count]) => {
      const enemy = ENEMY_TYPES[typeId];
      return `<span class="preview-pill" style="--enemy-color:${enemy.color}">${enemy.name}: ${count}</span>`;
    })
    .join("");
}

function placementMessage(col, row) {
  const tower = TOWER_TYPES[state.selectedTowerType];
  if (isPathCell(col, row)) {
    return "Esa casilla es la ruta del ataque. Coloca defensas en los bordes.";
  }
  if (!canPlaceTower(state, col, row)) {
    return `No hay energia suficiente o la casilla esta ocupada. ${tower.name} cuesta ${tower.cost}.`;
  }
  return "No se pudo instalar la defensa en esa posicion.";
}

function showRewardPanel() {
  if (state.lives <= 0) {
    return;
  }

  const rewards = [
    ["cache", "Cache tactica", "+45 energia para decidir rapido."],
    ["patch", "Parche critico", "+3 integridad para sostener la sesion."],
    ["overclock", "Overclock", "Todas las defensas ganan un nivel."]
  ];

  hud.rewardCards.innerHTML = "";
  rewards.forEach(([id, title, body]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "reward-card";
    button.innerHTML = `<strong>${title}</strong><span>${body}</span>`;
    button.addEventListener("click", () => {
      applyReward(state, id);
      hideRewardPanel();
      renderHud();
    });
    hud.rewardCards.append(button);
  });
  hud.rewardPanel.hidden = false;
}

function hideRewardPanel() {
  hud.rewardPanel.hidden = true;
}

function draw() {
  drawBackground();
  drawPath();
  drawBuildHints();
  drawTowers();
  drawEnemies();
  drawCore();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#08101f");
  gradient.addColorStop(1, "#111a31");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(111, 210, 255, 0.08)";
  ctx.lineWidth = 1;
  for (let col = 0; col <= GRID.cols; col += 1) {
    ctx.beginPath();
    ctx.moveTo(col * GRID.cellSize, 0);
    ctx.lineTo(col * GRID.cellSize, canvas.height);
    ctx.stroke();
  }
  for (let row = 0; row <= GRID.rows; row += 1) {
    ctx.beginPath();
    ctx.moveTo(0, row * GRID.cellSize);
    ctx.lineTo(canvas.width, row * GRID.cellSize);
    ctx.stroke();
  }
}

function drawPath() {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(77, 255, 202, 0.22)";
  ctx.lineWidth = GRID.cellSize * 0.72;
  tracePath();
  ctx.stroke();

  ctx.strokeStyle = "rgba(77, 255, 202, 0.7)";
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 10]);
  tracePath();
  ctx.stroke();
  ctx.setLineDash([]);
}

function tracePath() {
  ctx.beginPath();
  PATH.forEach((cell, index) => {
    const point = cellToPoint(cell.col, cell.row);
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
}

function drawBuildHints() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.025)";
  for (let row = 0; row < GRID.rows; row += 1) {
    for (let col = 0; col < GRID.cols; col += 1) {
      if (canPlaceTower(state, col, row)) {
        ctx.fillRect(col * GRID.cellSize + 7, row * GRID.cellSize + 7, GRID.cellSize - 14, GRID.cellSize - 14);
      }
    }
  }
}

function drawTowers() {
  state.towers.forEach((tower) => {
    const type = TOWER_TYPES[tower.typeId];
    const selected = tower.id === selectedTowerId;
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, selected ? 23 : 19, 0, Math.PI * 2);
    ctx.fillStyle = type.color;
    ctx.shadowColor = type.color;
    ctx.shadowBlur = selected ? 24 : 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#07101e";
    ctx.font = "700 11px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(type.shortName, tower.x, tower.y + 4);
    ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
    ctx.fillText(`L${tower.level}`, tower.x, tower.y + 30);

    const target = state.enemies.find((enemy) => enemy.id === tower.targetId);
    if (target && performance.now() - tower.lastShotTime < 110) {
      ctx.strokeStyle = type.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tower.x, tower.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
    }
  });
  ctx.textAlign = "start";
}

function drawEnemies() {
  state.enemies.forEach((enemy) => {
    const type = ENEMY_TYPES[enemy.typeId];
    const radius = enemy.typeId === "botnet" ? 17 : 13;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = type.color;
    ctx.shadowColor = type.color;
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.shadowBlur = 0;

    const barWidth = 34;
    const ratio = Math.max(0, enemy.hp / enemy.maxHp);
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(enemy.x - barWidth / 2, enemy.y - radius - 12, barWidth, 5);
    ctx.fillStyle = ratio > 0.45 ? "#4dffca" : "#ff5d73";
    ctx.fillRect(enemy.x - barWidth / 2, enemy.y - radius - 12, barWidth * ratio, 5);

    if (enemy.slowTimer > 0) {
      ctx.strokeStyle = "#bfa7ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, radius + 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
}

function drawCore() {
  const core = cellToPoint(13, 5);
  const pulse = 4 + Math.sin(performance.now() / 180) * 3;
  ctx.beginPath();
  ctx.arc(core.x, core.y, 24 + pulse, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(77, 255, 202, 0.17)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(core.x, core.y, 18, 0, Math.PI * 2);
  ctx.fillStyle = "#4dffca";
  ctx.fill();
  ctx.fillStyle = "#07101e";
  ctx.font = "700 10px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("CPU", core.x, core.y + 4);
  ctx.textAlign = "start";
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js").catch(() => {
    state.message = "La app sigue funcionando, pero el modo offline no se pudo activar.";
  });
}
