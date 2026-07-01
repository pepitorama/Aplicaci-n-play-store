import { DEFAULT_MAP_ID, MAPS, getMapDefinition } from "./maps.js";

export const GRID = {
  cols: 14,
  rows: 9,
  cellSize: 52
};

export const DIFFICULTY_PRESETS = {
  easy: {
    id: "easy",
    name: "Facil",
    startingMoney: 160,
    startingLives: 24,
    enemyHealth: 0.86,
    enemySpeed: 0.92,
    waveSize: 0.86,
    reward: 1.14,
    score: 0.9
  },
  normal: {
    id: "normal",
    name: "Normal",
    startingMoney: 130,
    startingLives: 20,
    enemyHealth: 1,
    enemySpeed: 1,
    waveSize: 1,
    reward: 1,
    score: 1
  },
  hard: {
    id: "hard",
    name: "Dificil",
    startingMoney: 110,
    startingLives: 16,
    enemyHealth: 1.18,
    enemySpeed: 1.08,
    waveSize: 1.14,
    reward: 1.08,
    score: 1.2
  }
};

export const TARGET_MODES = {
  first: {
    id: "first",
    name: "Primero",
    description: "Ataca la amenaza mas avanzada."
  },
  strong: {
    id: "strong",
    name: "Fuerte",
    description: "Prioriza la amenaza con mas vida."
  },
  fast: {
    id: "fast",
    name: "Rapido",
    description: "Prioriza la amenaza mas veloz."
  },
  weak: {
    id: "weak",
    name: "Debil",
    description: "Remata amenazas con poca vida."
  }
};

export { DEFAULT_MAP_ID, MAPS, getMapDefinition };

export const PATH = getMapDefinition(DEFAULT_MAP_ID).path;

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
    unlockWave: 0,
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
    unlockWave: 0,
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
    unlockWave: 0,
    description: "Reduce velocidad y abre ventanas de reaccion."
  },
  tesla: {
    id: "tesla",
    name: "IA Centinela",
    shortName: "IA",
    cost: 95,
    upgradeCost: 110,
    damage: 12,
    range: 138,
    cooldown: 0.42,
    chain: 2,
    color: "#4dffca",
    unlockWave: 4,
    description: "Se desbloquea en oleada 4 y prioriza amenazas avanzadas."
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
  },
  ransomware: {
    id: "ransomware",
    name: "Ransomware",
    hp: 118,
    speed: 28,
    reward: 22,
    color: "#ff4fd8"
  }
};

const pathCells = getPathCellKeys(PATH);

export function getDifficultyPreset(difficultyId = "normal") {
  return DIFFICULTY_PRESETS[difficultyId] || DIFFICULTY_PRESETS.normal;
}

export function getUnlockedTowerTypes(wave = 0) {
  return Object.values(TOWER_TYPES)
    .filter((tower) => tower.unlockWave <= wave)
    .map((tower) => tower.id);
}

export function isTowerUnlocked(state, typeId) {
  return !state.unlockedTowerTypes || state.unlockedTowerTypes.includes(typeId);
}

export function unlockAvailableTowers(state) {
  const unlockedBefore = new Set(state.unlockedTowerTypes || []);
  state.unlockedTowerTypes = Array.from(new Set([...(state.unlockedTowerTypes || []), ...getUnlockedTowerTypes(state.wave)]));
  const newlyUnlocked = state.unlockedTowerTypes.filter((typeId) => !unlockedBefore.has(typeId));

  newlyUnlocked.forEach((typeId) => {
    addEvent(state, {
      type: "unlock",
      towerType: typeId,
      message: `${TOWER_TYPES[typeId].name} desbloqueado.`
    });
  });

  return newlyUnlocked;
}

export function setDifficulty(state, difficultyId) {
  if (state.activeWave || state.wave > 0 || state.towers.length > 0) {
    return false;
  }

  const preset = getDifficultyPreset(difficultyId);
  state.difficultyId = preset.id;
  state.money = preset.startingMoney;
  state.lives = preset.startingLives;
  state.message = `Dificultad ${preset.name} seleccionada. Coloca defensas y empieza.`;
  addEvent(state, { type: "difficulty", difficultyId: preset.id });
  return true;
}

export function setMap(state, mapId) {
  if (state.activeWave || state.wave > 0 || state.towers.length > 0) {
    return false;
  }

  const map = getMapDefinition(mapId);
  state.mapId = map.id;
  state.path = map.path;
  state.message = `Mapa ${map.name} seleccionado. Ajusta la defensa a su ruta.`;
  addEvent(state, { type: "map", mapId: map.id });
  return true;
}

export function getWaveProgress(state) {
  if (!state.waveTotal) {
    return 0;
  }
  return Math.max(0, Math.min(1, state.waveResolved / state.waveTotal));
}

export function drainEvents(state) {
  const events = state.eventQueue || [];
  state.eventQueue = [];
  return events;
}

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

export function createGameState(options = {}) {
  const difficulty = getDifficultyPreset(options.difficultyId);
  const map = getMapDefinition(options.mapId);
  return {
    money: difficulty.startingMoney,
    lives: difficulty.startingLives,
    score: 0,
    wave: 0,
    focusStreak: 0,
    difficultyId: difficulty.id,
    mapId: map.id,
    path: map.path,
    selectedTowerType: "packet",
    nextTowerId: 1,
    nextEnemyId: 1,
    towers: [],
    enemies: [],
    waveQueue: [],
    waveTotal: 0,
    waveResolved: 0,
    spawnedThisWave: 0,
    defeatedThisWave: 0,
    spawnTimer: 0,
    activeWave: false,
    lastWaveLeaks: 0,
    totalKills: 0,
    killsByType: {},
    towersPlacedByType: {},
    perfectWaves: 0,
    maxWaveReached: 0,
    unlockedTowerTypes: getUnlockedTowerTypes(0),
    eventQueue: [],
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

export function isPathCellForState(state, col, row) {
  const path = state.path || PATH;
  return getPathCellKeys(path).has(cellKey(col, row));
}

export function isInsideGrid(col, row) {
  return col >= 0 && col < GRID.cols && row >= 0 && row < GRID.rows;
}

export function towerAt(state, col, row) {
  return state.towers.find((tower) => tower.col === col && tower.row === row);
}

export function cycleTowerTargetMode(state, towerId) {
  const tower = state.towers.find((item) => item.id === towerId);
  if (!tower) {
    return false;
  }

  const modeIds = Object.keys(TARGET_MODES);
  const currentIndex = Math.max(0, modeIds.indexOf(tower.targetMode || "first"));
  tower.targetMode = modeIds[(currentIndex + 1) % modeIds.length];
  state.message = `${TOWER_TYPES[tower.typeId].name}: prioridad ${TARGET_MODES[tower.targetMode].name}.`;
  addEvent(state, { type: "target-mode", towerType: tower.typeId, targetMode: tower.targetMode, x: tower.x, y: tower.y });
  return true;
}

export function canPlaceTower(state, col, row, typeId = state.selectedTowerType) {
  const type = TOWER_TYPES[typeId];
  return Boolean(
    type &&
      isTowerUnlocked(state, typeId) &&
      isInsideGrid(col, row) &&
      !isPathCellForState(state, col, row) &&
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
    targetMode: "first",
    invested: type.cost,
    ...cellToPoint(col, row)
  });
  state.nextTowerId += 1;
  state.towersPlacedByType[typeId] = (state.towersPlacedByType[typeId] || 0) + 1;
  state.message = `${type.name} instalado. Observa la ruta y ajusta tu defensa.`;
  addEvent(state, { type: "place", towerType: typeId, x: cellToPoint(col, row).x, y: cellToPoint(col, row).y });
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
  tower.invested = (tower.invested || type.cost) + cost;
  state.message = `${type.name} subio a nivel ${tower.level}.`;
  addEvent(state, { type: "upgrade", towerType: tower.typeId, x: tower.x, y: tower.y });
  return true;
}

export function getUpgradeCost(tower) {
  const type = TOWER_TYPES[tower.typeId];
  return Math.round(type.upgradeCost * tower.level * 1.25);
}

export function getTowerSellValue(tower) {
  const type = TOWER_TYPES[tower.typeId];
  return Math.max(1, Math.round((tower.invested || type.cost) * 0.6));
}

export function sellTower(state, towerId) {
  const towerIndex = state.towers.findIndex((tower) => tower.id === towerId);
  if (towerIndex === -1) {
    return false;
  }

  const [tower] = state.towers.splice(towerIndex, 1);
  const refund = getTowerSellValue(tower);
  state.money += refund;
  state.message = `${TOWER_TYPES[tower.typeId].name} vendida: +${refund} energia.`;
  addEvent(state, { type: "sell", towerType: tower.typeId, x: tower.x, y: tower.y, refund });
  return true;
}

export function buildWave(waveNumber, leaksLastWave = 0, difficultyId = "normal") {
  const difficulty = getDifficultyPreset(difficultyId);
  const difficultyRelief = leaksLastWave >= 3 ? -1 : 0;
  const adjustedWave = Math.max(1, waveNumber + difficultyRelief);
  const queue = [];
  const baseCount = Math.max(3, Math.round((5 + adjustedWave * 1.8) * difficulty.waveSize));

  for (let index = 0; index < baseCount; index += 1) {
    const isFast = adjustedWave >= 2 && index % 5 === 3;
    const isTank = adjustedWave >= 3 && index % 6 === 5;
    const isBoss = adjustedWave >= 5 && index === baseCount - 1;
    const typeId = isBoss ? "ransomware" : isTank ? "botnet" : isFast ? "spyware" : "worm";
    queue.push({
      typeId,
      delay: index === 0 ? 0.2 : 0.58 + Math.max(0, 0.04 - adjustedWave * 0.004)
    });
  }

  return queue;
}

export function previewWave(waveNumber, leaksLastWave = 0, difficultyId = "normal") {
  return buildWave(waveNumber, leaksLastWave, difficultyId).reduce((summary, item) => {
    summary[item.typeId] = (summary[item.typeId] || 0) + 1;
    return summary;
  }, {});
}

export function startNextWave(state) {
  if (state.activeWave || state.enemies.length > 0) {
    return false;
  }

  state.wave += 1;
  state.maxWaveReached = Math.max(state.maxWaveReached, state.wave);
  state.waveQueue = buildWave(state.wave, state.lastWaveLeaks, state.difficultyId);
  state.waveTotal = state.waveQueue.length;
  state.waveResolved = 0;
  state.spawnedThisWave = 0;
  state.defeatedThisWave = 0;
  state.spawnTimer = 0;
  state.activeWave = true;
  state.lastWaveLeaks = 0;
  state.message = `Oleada ${state.wave}: mira la vista previa y reacciona con upgrades.`;
  addEvent(state, { type: "wave-start", wave: state.wave });
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
    addEvent(state, { type: "reward", rewardId });
    return true;
  }

  if (rewardId === "patch") {
    state.lives = Math.min(25, state.lives + 3);
    state.message = "Parche critico aplicado: +3 integridad.";
    addEvent(state, { type: "reward", rewardId });
    return true;
  }

  if (rewardId === "overclock") {
    state.towers.forEach((tower) => {
      tower.level += 1;
    });
    state.message = "Overclock global: todas las defensas suben un nivel.";
    addEvent(state, { type: "reward", rewardId });
    return true;
  }

  if (rewardId === "blueprint") {
    const lockedTower = Object.values(TOWER_TYPES).find((tower) => !isTowerUnlocked(state, tower.id));
    if (!lockedTower) {
      state.money += 35;
      state.message = "Todos los planos estan activos: +35 energia.";
    } else {
      state.unlockedTowerTypes.push(lockedTower.id);
      state.message = `${lockedTower.name} desbloqueado antes de tiempo.`;
      addEvent(state, { type: "unlock", towerType: lockedTower.id, message: state.message });
    }
    addEvent(state, { type: "reward", rewardId });
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
    const difficulty = getDifficultyPreset(state.difficultyId);
    const healthScale = (1 + (state.wave - 1) * 0.16) * difficulty.enemyHealth;
    const enemy = {
      id: state.nextEnemyId,
      typeId: next.typeId,
      hp: Math.round(type.hp * healthScale),
      maxHp: Math.round(type.hp * healthScale),
      speed: type.speed * difficulty.enemySpeed * (1 + Math.min(0.22, state.wave * 0.018)),
      reward: Math.round(type.reward * difficulty.reward * (1 + state.wave * 0.04)),
      progress: 0,
      slowTimer: 0,
      slowFactor: 1,
      leaked: false,
      ...pointOnPath(0, state.path || PATH)
    };
    state.enemies.push(enemy);
    state.spawnedThisWave += 1;
    state.nextEnemyId += 1;
    addEvent(state, { type: "spawn", enemyType: enemy.typeId, x: enemy.x, y: enemy.y });
    state.spawnTimer += next.delay;
  }
}

function updateEnemies(state, deltaSeconds) {
  for (const enemy of state.enemies) {
    const speedMultiplier = enemy.slowTimer > 0 ? enemy.slowFactor : 1;
    enemy.slowTimer = Math.max(0, enemy.slowTimer - deltaSeconds);
    enemy.progress += enemy.speed * speedMultiplier * deltaSeconds;
    const position = pointOnPath(enemy.progress, state.path || PATH);
    enemy.x = position.x;
    enemy.y = position.y;

    if (enemy.progress >= pathLength(state.path || PATH) && !enemy.leaked) {
      enemy.leaked = true;
      state.lives -= 1;
      state.lastWaveLeaks += 1;
      state.waveResolved += 1;
      state.focusStreak = 0;
      addEvent(state, { type: "leak", enemyType: enemy.typeId, x: enemy.x, y: enemy.y });
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
    const damage = Math.round(type.damage * levelMultiplier);
    target.hp -= damage;
    if (type.slow) {
      target.slowFactor = type.slow;
      target.slowTimer = type.slowDuration + tower.level * 0.18;
    }
    if (type.chain) {
      const chainTargets = state.enemies
        .filter((enemy) => enemy.id !== target.id && distance(target, enemy) <= 82)
        .slice(0, type.chain);
      chainTargets.forEach((enemy) => {
        enemy.hp -= Math.round(damage * 0.55);
      });
    }
    tower.cooldownRemaining = Math.max(0.18, type.cooldown - (tower.level - 1) * 0.06);
    tower.lastShotTime = performanceNow();
    tower.targetId = target.id;
    addEvent(state, { type: "hit", towerType: tower.typeId, enemyType: target.typeId, x: target.x, y: target.y });
  }
}

function clearDefeatedEnemies(state) {
  const survivors = [];
  const difficulty = getDifficultyPreset(state.difficultyId);
  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) {
      state.money += enemy.reward;
      state.score += Math.round(enemy.reward * 10 * difficulty.score);
      state.totalKills += 1;
      state.killsByType[enemy.typeId] = (state.killsByType[enemy.typeId] || 0) + 1;
      state.defeatedThisWave += 1;
      state.waveResolved += 1;
      addEvent(state, {
        type: "defeat",
        enemyType: enemy.typeId,
        x: enemy.x,
        y: enemy.y,
        reward: enemy.reward
      });
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
  const unlocked = unlockAvailableTowers(state);
  if (state.lastWaveLeaks === 0) {
    state.focusStreak += 1;
    state.perfectWaves += 1;
    const bonus = 20 + state.focusStreak * 6;
    state.money += bonus;
    state.score += Math.round(bonus * 12 * getDifficultyPreset(state.difficultyId).score);
    state.message = `Oleada perfecta. Racha de foco x${state.focusStreak}: +${bonus} energia.`;
  } else {
    state.message = `Oleada superada con ${state.lastWaveLeaks} fuga(s). La proxima se ajusta un poco.`;
  }
  addEvent(state, {
    type: "wave-complete",
    wave: state.wave,
    perfect: state.lastWaveLeaks === 0,
    unlocked
  });
}

function findTarget(state, tower, range) {
  const candidates = state.enemies.filter((enemy) => distance(tower, enemy) <= range);
  if (candidates.length === 0) {
    return null;
  }

  const targetMode = tower.targetMode || "first";
  if (targetMode === "strong") {
    return candidates.reduce((best, enemy) => (enemy.hp > best.hp ? enemy : best));
  }
  if (targetMode === "fast") {
    return candidates.reduce((best, enemy) => (enemy.speed > best.speed ? enemy : best));
  }
  if (targetMode === "weak") {
    return candidates.reduce((best, enemy) => (enemy.hp < best.hp ? enemy : best));
  }

  return candidates.reduce((best, enemy) => (enemy.progress > best.progress ? enemy : best));
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function getPathCellKeys(path) {
  const keys = new Set();
  for (let index = 1; index < path.length; index += 1) {
    const from = path[index - 1];
    const to = path[index];
    const stepCol = Math.sign(to.col - from.col);
    const stepRow = Math.sign(to.row - from.row);
    let col = from.col;
    let row = from.row;
    keys.add(cellKey(col, row));
    while (col !== to.col || row !== to.row) {
      col += stepCol;
      row += stepRow;
      keys.add(cellKey(col, row));
    }
  }
  return keys;
}

function addEvent(state, event) {
  if (!state.eventQueue) {
    state.eventQueue = [];
  }
  state.eventQueue.push({
    at: performanceNow(),
    ...event
  });
}

function performanceNow() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}
