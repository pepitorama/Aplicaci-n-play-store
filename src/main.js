import {
  GRID,
  TOWER_TYPES,
  applyReward,
  canPlaceTower,
  createGameState,
  cycleTowerTargetMode,
  drainEvents,
  isPathCell,
  isTowerUnlocked,
  placeTower,
  setDifficulty,
  startNextWave,
  towerAt,
  updateGame,
  upgradeTower
} from "./gameLogic.js";
import { SoundEngine } from "./audio.js";
import { createRenderer } from "./renderer.js";
import { collectUiElements, createUi } from "./ui.js";
import {
  loadProfile,
  markTutorialSeen,
  recordNewRun,
  saveProfile,
  setMuted,
  updateProfileFromState
} from "./storage.js";

const canvas = document.querySelector("#game-canvas");
const renderer = createRenderer(canvas);
const elements = collectUiElements();

let profile = loadProfile();
let state = createStateFromProfile();
let selectedTowerId = null;
let lastTimestamp = 0;
let rewardPendingForWave = 0;
let effects = [];
let runRecorded = false;
let isPaused = false;
let speedMultiplier = 1;

const sound = new SoundEngine({ muted: profile.muted });
const ui = createUi(elements, {
  onStartWave: () => startWaveFromInput(),
  onRestart: () => restartGame(),
  onToggleMute: () => toggleMute(),
  onDifficulty: (difficultyId) => chooseDifficulty(difficultyId),
  onTowerSelect: (towerId) => selectTower(towerId),
  onReward: (rewardId) => chooseReward(rewardId),
  onTutorialDone: () => completeTutorial(),
  onTogglePause: () => togglePause(),
  onToggleSpeed: () => toggleSpeed(),
  onTargetMode: () => changeSelectedTargetMode()
});

bindCanvas();
bindKeyboard();
renderUi();
if (!profile.tutorialSeen) {
  ui.showTutorial();
}
requestAnimationFrame(loop);

function createStateFromProfile() {
  const nextState = createGameState({ difficultyId: profile.difficultyId });
  nextState.unlockedTowerTypes = Array.from(
    new Set([...(nextState.unlockedTowerTypes || []), ...(profile.unlockedTowerTypes || [])])
  );
  return nextState;
}

function bindCanvas() {
  canvas.addEventListener("click", (event) => {
    sound.resume();
    const { col, row } = getCanvasCell(event);
    const tower = towerAt(state, col, row);

    if (tower && event.shiftKey) {
      selectedTowerId = tower.id;
      cycleTowerTargetMode(state, tower.id);
    } else if (tower) {
      selectedTowerId = tower.id;
      if (!upgradeTower(state, tower.id)) {
        state.message = `${TOWER_TYPES[tower.typeId].name} seleccionado. Necesitas mas energia para mejorarlo.`;
      }
    } else {
      selectedTowerId = null;
      if (!placeTower(state, col, row)) {
        state.message = placementMessage(col, row);
      }
    }

    processEvents();
    renderUi();
  });
}

function bindKeyboard() {
  document.addEventListener("keydown", (event) => {
    const towerIds = Object.keys(TOWER_TYPES);
    if (event.key >= "1" && event.key <= String(towerIds.length)) {
      selectTower(towerIds[Number(event.key) - 1]);
    }

    if (event.code === "Space") {
      event.preventDefault();
      startWaveFromInput();
    }

    if (event.key.toLowerCase() === "p") {
      togglePause();
    }

    if (event.key.toLowerCase() === "f") {
      toggleSpeed();
    }

    if (event.key.toLowerCase() === "t") {
      changeSelectedTargetMode();
    }
  });
}

function loop(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
  }

  const rawDeltaSeconds = Math.min(0.05, (timestamp - lastTimestamp) / 1000);
  const deltaSeconds = rawDeltaSeconds * speedMultiplier;
  lastTimestamp = timestamp;
  const wasActive = state.activeWave;

  if (!isPaused) {
    updateGame(state, deltaSeconds);
    processEvents();
  }
  updateEffects(rawDeltaSeconds);

  if (wasActive && !state.activeWave && state.wave > 0 && rewardPendingForWave !== state.wave) {
    rewardPendingForWave = state.wave;
    profile = updateProfileFromState(profile, state);
    ui.showRewards(state);
  }

  if (state.lives <= 0) {
    profile = updateProfileFromState(profile, state);
  }

  renderer.render(state, { selectedTowerId, effects });
  renderUi();
  requestAnimationFrame(loop);
}

function startWaveFromInput() {
  sound.resume();
  ui.hideRewards();
  if (!runRecorded && state.wave === 0) {
    profile = recordNewRun(profile, state.difficultyId);
    runRecorded = true;
  }
  startNextWave(state);
  processEvents();
  renderUi();
}

function restartGame() {
  profile = updateProfileFromState(profile, state);
  state = createStateFromProfile();
  selectedTowerId = null;
  rewardPendingForWave = 0;
  effects = [];
  runRecorded = false;
  isPaused = false;
  speedMultiplier = 1;
  ui.hideRewards();
  renderUi();
}

function chooseDifficulty(difficultyId) {
  sound.resume();
  if (setDifficulty(state, difficultyId)) {
    profile = { ...profile, difficultyId };
    saveProfile(profile);
  }
  processEvents();
  renderUi();
}

function selectTower(towerId) {
  if (!isTowerUnlocked(state, towerId)) {
    state.message = `${TOWER_TYPES[towerId].name} todavia esta bloqueada.`;
    renderUi();
    return;
  }
  state.selectedTowerType = towerId;
  selectedTowerId = null;
  renderUi();
}

function chooseReward(rewardId) {
  sound.resume();
  if (applyReward(state, rewardId)) {
    profile = updateProfileFromState(profile, state);
  }
  ui.hideRewards();
  processEvents();
  renderUi();
}

function toggleMute() {
  profile = setMuted(profile, !profile.muted);
  sound.setMuted(profile.muted);
  renderUi();
}

function completeTutorial() {
  profile = markTutorialSeen(profile);
  renderUi();
}

function togglePause() {
  if (state.lives <= 0) {
    return;
  }
  isPaused = !isPaused;
  state.message = isPaused ? "Simulacion pausada. Pulsa P o Continuar para seguir." : "Simulacion reanudada.";
  renderUi();
}

function toggleSpeed() {
  const speeds = [1, 2, 3];
  const currentIndex = speeds.indexOf(speedMultiplier);
  speedMultiplier = speeds[(currentIndex + 1) % speeds.length];
  state.message = `Velocidad de simulacion x${speedMultiplier}.`;
  renderUi();
}

function changeSelectedTargetMode() {
  if (!selectedTowerId) {
    state.message = "Selecciona una torre para cambiar su prioridad.";
    renderUi();
    return;
  }
  cycleTowerTargetMode(state, selectedTowerId);
  processEvents();
  renderUi();
}

function getCanvasCell(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;
  return {
    col: Math.floor(x / GRID.cellSize),
    row: Math.floor(y / GRID.cellSize)
  };
}

function placementMessage(col, row) {
  const tower = TOWER_TYPES[state.selectedTowerType];
  if (!tower) {
    return "Selecciona una defensa valida.";
  }
  if (isPathCell(col, row)) {
    return "Esa casilla es la ruta del ataque. Coloca defensas en los bordes.";
  }
  if (!canPlaceTower(state, col, row)) {
    return `No hay energia suficiente, la casilla esta ocupada o la defensa no esta desbloqueada. ${tower.name} cuesta ${tower.cost}.`;
  }
  return "No se pudo instalar la defensa en esa posicion.";
}

function processEvents() {
  const events = drainEvents(state);
  if (events.length === 0) {
    return;
  }

  sound.playEvents(events);
  events.forEach((event) => {
    if (event.type === "unlock" || event.type === "wave-complete") {
      profile = updateProfileFromState(profile, state);
    }
    if (event.x !== undefined && event.y !== undefined) {
      effects.push({
        x: event.x,
        y: event.y,
        radius: event.type === "leak" ? 24 : 14,
        duration: event.type === "hit" ? 0.22 : 0.42,
        age: 0,
        color: effectColor(event.type)
      });
    }
  });
}

function renderUi() {
  ui.render(state, profile, selectedTowerId, { isPaused, speedMultiplier });
}

function updateEffects(deltaSeconds) {
  effects.forEach((effect) => {
    effect.age += deltaSeconds;
  });
  effects = effects.filter((effect) => effect.age < effect.duration);
}

function effectColor(type) {
  if (type === "leak") {
    return "#ff5d73";
  }
  if (type === "upgrade" || type === "reward") {
    return "#ffb84a";
  }
  if (type === "defeat") {
    return "#4dffca";
  }
  return "#40d9ff";
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js").catch(() => {
    state.message = "La app sigue funcionando, pero el modo offline no se pudo activar.";
  });
}
