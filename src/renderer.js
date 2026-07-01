import { ENEMY_TYPES, GRID, PATH, TARGET_MODES, TOWER_TYPES, canPlaceTower, cellToPoint } from "./gameLogic.js";

export function createRenderer(canvas) {
  const ctx = canvas.getContext("2d");
  canvas.width = GRID.cols * GRID.cellSize;
  canvas.height = GRID.rows * GRID.cellSize;

  return {
    render(state, { selectedTowerId = null, effects = [] } = {}) {
      drawBackground(ctx, canvas);
      drawPath(ctx, state.path || PATH);
      drawBuildHints(ctx, state);
      drawSelectedRange(ctx, state, selectedTowerId);
      drawTowers(ctx, state, selectedTowerId);
      drawEnemies(ctx, state);
      drawEffects(ctx, effects);
      drawCore(ctx, state);
    }
  };
}

function drawBackground(ctx, canvas) {
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

function drawPath(ctx, path) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(77, 255, 202, 0.22)";
  ctx.lineWidth = GRID.cellSize * 0.72;
  tracePath(ctx, path);
  ctx.stroke();

  ctx.strokeStyle = "rgba(77, 255, 202, 0.7)";
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 10]);
  tracePath(ctx, path);
  ctx.stroke();
  ctx.setLineDash([]);
}

function tracePath(ctx, path) {
  ctx.beginPath();
  path.forEach((cell, index) => {
    const point = cellToPoint(cell.col, cell.row);
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
}

function drawBuildHints(ctx, state) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.025)";
  for (let row = 0; row < GRID.rows; row += 1) {
    for (let col = 0; col < GRID.cols; col += 1) {
      if (canPlaceTower(state, col, row)) {
        ctx.fillRect(col * GRID.cellSize + 7, row * GRID.cellSize + 7, GRID.cellSize - 14, GRID.cellSize - 14);
      }
    }
  }
}

function drawSelectedRange(ctx, state, selectedTowerId) {
  const tower = state.towers.find((item) => item.id === selectedTowerId);
  if (!tower) {
    return;
  }

  const type = TOWER_TYPES[tower.typeId];
  ctx.beginPath();
  ctx.arc(tower.x, tower.y, type.range + tower.level * 8, 0, Math.PI * 2);
  ctx.fillStyle = `${type.color}14`;
  ctx.strokeStyle = `${type.color}70`;
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
}

function drawTowers(ctx, state, selectedTowerId) {
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
    ctx.fillText(type.icon || type.shortName, tower.x, tower.y + 4);
    ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
    ctx.fillText(`L${tower.level}`, tower.x, tower.y + 30);
    ctx.fillText(TARGET_MODES[tower.targetMode || "first"].name.slice(0, 3).toUpperCase(), tower.x, tower.y - 28);

    const target = state.enemies.find((enemy) => enemy.id === tower.targetId);
    if (target && performance.now() - tower.lastShotTime < 110) {
      ctx.strokeStyle = type.color;
      ctx.lineWidth = tower.typeId === "tesla" ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(tower.x, tower.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
    }
  });
  ctx.textAlign = "start";
}

function drawEnemies(ctx, state) {
  state.enemies.forEach((enemy) => {
    const type = ENEMY_TYPES[enemy.typeId];
    const radius = enemy.typeId === "botnet" || enemy.typeId === "ransomware" || enemy.typeId === "rootkit" ? 17 : enemy.typeId === "ddos" ? 10 : 13;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = type.color;
    ctx.shadowColor = type.color;
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#07101e";
    ctx.font = "700 10px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(type.icon || "?", enemy.x, enemy.y + 3);
    ctx.textAlign = "start";

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

function drawEffects(ctx, effects) {
  effects.forEach((effect) => {
    const ratio = Math.max(0, 1 - effect.age / effect.duration);
    const radius = effect.radius * (1 + (1 - ratio) * 1.5);
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = effect.color;
    ctx.globalAlpha = ratio;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.globalAlpha = 1;
  });
}

function drawCore(ctx, state) {
  const path = state.path || PATH;
  const end = path[path.length - 1];
  const core = cellToPoint(end.col, end.row);
  const danger = state.lives <= 6;
  const pulse = 4 + Math.sin(performance.now() / (danger ? 90 : 180)) * 3;
  ctx.beginPath();
  ctx.arc(core.x, core.y, 24 + pulse, 0, Math.PI * 2);
  ctx.fillStyle = danger ? "rgba(255, 93, 115, 0.22)" : "rgba(77, 255, 202, 0.17)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(core.x, core.y, 18, 0, Math.PI * 2);
  ctx.fillStyle = danger ? "#ff5d73" : "#4dffca";
  ctx.fill();
  ctx.fillStyle = "#07101e";
  ctx.font = "700 10px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("CPU", core.x, core.y + 4);
  ctx.textAlign = "start";
}
