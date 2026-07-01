export const GRID = {
  cols: 14,
  rows: 9,
  cellSize: 52
};

export const PATH = [
  { col: 0, row: 4 },
  { col: 1, row: 4 },
  { col: 2, row: 4 },
  { col: 3, row: 4 },
  { col: 3, row: 2 },
  { col: 5, row: 2 },
  { col: 5, row: 6 },
  { col: 8, row: 6 },
  { col: 8, row: 3 },
  { col: 11, row: 3 },
  { col: 11, row: 5 },
  { col: 13, row: 5 }
];

export const TOWER_TYPES = {
  packet: {
    id: "packet",
    name: "Analizador",
    shortName: "ANA",
    cost: 45,
    upgradeCost: 60,
    damage: 16,
    range: 118,
    cooldown: 0.62,
    color: "#40d9ff",
    description: "Dano rapido y equilibrado contra malware comun."
  },
  firewall: {
    id: "firewall",
    name: "Firewall",
    shortName: "FIR",
    cost: 70,
    upgradeCost: 85,
    damage: 28,
    range: 96,
    cooldown: 1.05,
    color: "#ffb84a",
    description: "Golpes pesados contra bots blindados."
  },
  freezer: {
    id: "freezer",
    name: "Sandbox",
    shortName: "SAN",
    cost: 55,
    upgradeCost: 75,
    damage: 8,
    range: 108,
    cooldown: 0.9,
    slow: 0.46,
    slowDuration: 1.35,
    color: "#9f7cff",
    description: "Reduce velocidad y abre ventanas de reaccion."
  }
};

export const ENEMY_TYPES = {
  worm: {
    id: "worm",
    name: "Gusano",
    hp: 42,
    speed: 47,
    reward: 9,
    color: "#ff5d73"
  },
  botnet: {
    id: "botnet",
    name: "Botnet",
    hp: 78,
    speed: 34,
    reward: 14,
    color: "#ff8d4f"
  },
  spyware: {
    id: "spyware",
    name: "Spyware",
    hp: 31,
    speed: 66,
    reward: 12,
    color: "#e0ff5f"
  }
};

const pathCells = new Set(PATH.map((point) => cellKey(point.col, point.row)));

export function cellKey(col, row) {
  return `${col}:${row}`;
}

export function cellToPoint(col, row) {
  return {
    x: col * GRID.cellSize + GRID.cellSize / 2,
    y: row * GRID.cellSize + GRID.cellSize / 2
  };
}

export function pathLength(path = PATH) {
  let total = 0;
  for (let index = 1; index < path.length; index += 1) {
    const previous = cellToPoint(path[index - 1].col, path[index - 1].row);
    const current = cellToPoint(path[index].col, path[index].row);
    total += distance(previous, current);
  }
  return total;
}

export const TOTAL_PATH_LENGTH = pathLength();

export function pointOnPath(progress, path = PATH) {
  const clampedProgress = Math.max(0, Math.min(progress, pathLength(path)));
  let remaining = clampedProgress;

  for (let index = 1; index < path.length; index += 1) {
    const from = cellToPoint(path[index - 1].col, path[index - 1].row);
    const to = cellToPoint(path[index].col, path[index].row);
    const segmentLength = distance(from, to);

    if (remaining <= segmentLength) {
      const t = segmentLength === 0 ? 0 : remaining / segmentLength;
      return {
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t
      };
    }

    remaining -= segmentLength;
  }

  const last = path[path.length - 1];
  return cellToPoint(last.col, last.row);
}

export function createGameState() {
  return {
    money: 130,
    lives: 20,
    score: 0,
    wave: 0,
    focusStreak: 0,
    selectedTowerType: "packet",
    nextTowerId: 1,
    nextEnemyId: 1,
    towers: [],
    enemies: [],
    waveQueue: [],
    spawnTimer: 0,
    activeWave: false,
    lastWaveLeaks: 0,
    message: "Protege el nucleo: coloca defensas antes de iniciar la oleada.",
    researchNotes: [
      "Ruta legible y vista previa reducen carga cognitiva.",
      "Recompensas cortas despues de cada oleada elevan motivacion.",
      "Dificultad ajustada al rendimiento favorece flow."
    ]
  };
}

export function isPathCell(col, row) {
  return pathCells.has(cellKey(col, row));
}

export function isInsideGrid(col, row) {
  return col >= 0 && col < GRID.cols && row >= 0 && row < GRID.rows;
}

export function towerAt(state, col, row) {
  return state.towers.find((tower) => tower.col === col && tower.row === row);
}

export function canPlaceTower(state, col, row, typeId = state.selectedTowerType) {
  const type = TOWER_TYPES[typeId];
  return Boolean(
    type &&
      isInsideGrid(col, row) &&
      !isPathCell(col, row) &&
      !towerAt(state, col, row) &&
      state.money >= type.cost
  );
}

export function placeTower(state, col, row, typeId = state.selectedTowerType) {
  if (!canPlaceTower(state, col, row, typeId)) {
    return false;
  }

  const type = TOWER_TYPES[typeId];
  state.money -= type.cost;
  state.towers.push({
    id: state.nextTowerId,
    typeId,
    col,
    row,
    level: 1,
    cooldownRemaining: 0,
    lastShotTime: 0,
    targetId: null,
    ...cellToPoint(col, row)
  });
  state.nextTowerId += 1;
  state.message = `${type.name} instalado. Observa la ruta y ajusta tu defensa.`;
  return true;
}

export function upgradeTower(state, towerId) {
  const tower = state.towers.find((item) => item.id === towerId);
  if (!tower) {
    return false;
  }

  const type = TOWER_TYPES[tower.typeId];
  const cost = Math.round(type.upgradeCost * tower.level * 1.25);
  if (state.money < cost) {
    return false;
  }

  state.money -= cost;
  tower.level += 1;
  state.message = `${type.name} subio a nivel ${tower.level}.`;
  return true;
}

export function getUpgradeCost(tower) {
  const type = TOWER_TYPES[tower.typeId];
  return Math.round(type.upgradeCost * tower.level * 1.25);
}

export function buildWave(waveNumber, leaksLastWave = 0) {
  const difficultyRelief = leaksLastWave >= 3 ? -1 : 0;
  const adjustedWave = Math.max(1, waveNumber + difficultyRelief);
  const queue = [];
  const baseCount = 5 + Math.floor(adjustedWave * 1.8);

  for (let index = 0; index < baseCount; index += 1) {
    const isFast = adjustedWave >= 2 && index % 5 === 3;
    const isTank = adjustedWave >= 3 && index % 6 === 5;
    const typeId = isTank ? "botnet" : isFast ? "spyware" : "worm";
    queue.push({
      typeId,
      delay: index === 0 ? 0.2 : 0.58 + Math.max(0, 0.04 - adjustedWave * 0.004)
    });
  }

  return queue;
}

export function previewWave(waveNumber, leaksLastWave = 0) {
  return buildWave(waveNumber, leaksLastWave).reduce((summary, item) => {
    summary[item.typeId] = (summary[item.typeId] || 0) + 1;
    return summary;
  }, {});
}

export function startNextWave(state) {
  if (state.activeWave || state.enemies.length > 0) {
    return false;
  }

  state.wave += 1;
  state.waveQueue = buildWave(state.wave, state.lastWaveLeaks);
  state.spawnTimer = 0;
  state.activeWave = true;
  state.lastWaveLeaks = 0;
  state.message = `Oleada ${state.wave}: mira la vista previa y reacciona con upgrades.`;
  return true;
}

export function updateGame(state, deltaSeconds) {
  if (state.lives <= 0) {
    state.message = "El nucleo cayo. Reinicia y prueba otra estrategia.";
    return;
  }

  spawnEnemies(state, deltaSeconds);
  updateEnemies(state, deltaSeconds);
  updateTowers(state, deltaSeconds);
  clearDefeatedEnemies(state);
  finishWaveIfNeeded(state);
}

export function applyReward(state, rewardId) {
  if (rewardId === "cache") {
    state.money += 45;
    state.message = "Cache de emergencia: +45 energia.";
    return true;
  }

  if (rewardId === "patch") {
    state.lives = Math.min(25, state.lives + 3);
    state.message = "Parche critico aplicado: +3 integridad.";
    return true;
  }

  if (rewardId === "overclock") {
    state.towers.forEach((tower) => {
      tower.level += 1;
    });
    state.message = "Overclock global: todas las defensas suben un nivel.";
    return true;
  }

  return false;
}

function spawnEnemies(state, deltaSeconds) {
  if (!state.activeWave || state.waveQueue.length === 0) {
    return;
  }

  state.spawnTimer -= deltaSeconds;
  while (state.waveQueue.length > 0 && state.spawnTimer <= 0) {
    const next = state.waveQueue.shift();
    const type = ENEMY_TYPES[next.typeId];
    const healthScale = 1 + (state.wave - 1) * 0.16;
    state.enemies.push({
      id: state.nextEnemyId,
      typeId: next.typeId,
      hp: Math.round(type.hp * healthScale),
      maxHp: Math.round(type.hp * healthScale),
      speed: type.speed * (1 + Math.min(0.22, state.wave * 0.018)),
      reward: Math.round(type.reward * (1 + state.wave * 0.04)),
      progress: 0,
      slowTimer: 0,
      slowFactor: 1,
      leaked: false,
      ...pointOnPath(0)
    });
    state.nextEnemyId += 1;
    state.spawnTimer += next.delay;
  }
}

function updateEnemies(state, deltaSeconds) {
  for (const enemy of state.enemies) {
    const speedMultiplier = enemy.slowTimer > 0 ? enemy.slowFactor : 1;
    enemy.slowTimer = Math.max(0, enemy.slowTimer - deltaSeconds);
    enemy.progress += enemy.speed * speedMultiplier * deltaSeconds;
    const position = pointOnPath(enemy.progress);
    enemy.x = position.x;
    enemy.y = position.y;

    if (enemy.progress >= TOTAL_PATH_LENGTH && !enemy.leaked) {
      enemy.leaked = true;
      state.lives -= 1;
      state.lastWaveLeaks += 1;
      state.focusStreak = 0;
    }
  }

  state.enemies = state.enemies.filter((enemy) => !enemy.leaked);
}

function updateTowers(state, deltaSeconds) {
  for (const tower of state.towers) {
    const type = TOWER_TYPES[tower.typeId];
    tower.cooldownRemaining = Math.max(0, tower.cooldownRemaining - deltaSeconds);

    if (tower.cooldownRemaining > 0) {
      continue;
    }

    const target = findTarget(state, tower, type.range + tower.level * 8);
    if (!target) {
      tower.targetId = null;
      continue;
    }

    const levelMultiplier = 1 + (tower.level - 1) * 0.42;
    target.hp -= Math.round(type.damage * levelMultiplier);
    if (type.slow) {
      target.slowFactor = type.slow;
      target.slowTimer = type.slowDuration + tower.level * 0.18;
    }
    tower.cooldownRemaining = Math.max(0.18, type.cooldown - (tower.level - 1) * 0.06);
    tower.lastShotTime = performanceNow();
    tower.targetId = target.id;
  }
}

function clearDefeatedEnemies(state) {
  const survivors = [];
  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) {
      state.money += enemy.reward;
      state.score += enemy.reward * 10;
    } else {
      survivors.push(enemy);
    }
  }
  state.enemies = survivors;
}

function finishWaveIfNeeded(state) {
  if (!state.activeWave || state.waveQueue.length > 0 || state.enemies.length > 0) {
    return;
  }

  state.activeWave = false;
  if (state.lastWaveLeaks === 0) {
    state.focusStreak += 1;
    const bonus = 20 + state.focusStreak * 6;
    state.money += bonus;
    state.score += bonus * 12;
    state.message = `Oleada perfecta. Racha de foco x${state.focusStreak}: +${bonus} energia.`;
  } else {
    state.message = `Oleada superada con ${state.lastWaveLeaks} fuga(s). La proxima se ajusta un poco.`;
  }
}

function findTarget(state, tower, range) {
  let best = null;
  for (const enemy of state.enemies) {
    if (distance(tower, enemy) > range) {
      continue;
    }
    if (!best || enemy.progress > best.progress) {
      best = enemy;
    }
  }
  return best;
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function performanceNow() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}
