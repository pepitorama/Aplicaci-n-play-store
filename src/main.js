import {
  GRID,
  TOWER_TYPES,
  applyReward,
  canPlaceTower,
  createGameState,
  cycleTowerTargetMode,
  drainEvents,
  isPathCellForState,
  isTowerUnlocked,
  placeTower,
  sellTower,
  setDifficulty,
  setMap,
  startNextWave,
  towerAt,
  updateGame,
  upgradeTower
} from "./gameLogic.js";
import { SoundEngine } from "./audio.js";
import { createRenderer } from "./renderer.js";
import { collectUiElements, createUi } from "./ui.js";
import {
  awardResearch,
  backupProfile,
  buyResearchUpgrade,
  exportProfile,
  importProfile,
  loadProfile,
  markTutorialSeen,
  recordNewRun,
  saveProfile,
  setHighContrast,
  setColorMode,
  setLargeText,
  setMuted,
  setPreferredMap,
  setPracticeMode,
  setReducedMotion,
  resetProfile,
  updateBalanceMetrics,
  updateProfileFromState
} from "./storage.js";
import { evaluateAchievements, evaluateMissions, getResearchUpgradeCost, RESEARCH_UPGRADES } from "./progression.js";
import { evaluateCampaign, getCampaignStatus } from "./campaign.js";
import { getDailyChallenge } from "./dailyChallenge.js";
import { getBalanceSuggestions, getMapAnalysis } from "./analysis.js";

const canvas = document.querySelector("#game-canvas");
const renderer = createRenderer(canvas);
const elements = collectUiElements();
const GUIDED_TUTORIAL = [
  { eventType: "place", message: "Bien: ahora inicia una oleada con Espacio o el boton Iniciar." },
  { eventType: "wave-start", message: "Observa el ataque. Luego haz click en una torre para mejorarla." },
  { eventType: "upgrade", message: "Upgrade aplicado. Prueba T o Shift+click para cambiar prioridad." },
  { eventType: "target-mode", message: "Prioridad cambiada. Cuando necesites energia, vende una torre seleccionada." },
  { eventType: "sell", message: "Tutorial guiado completado. Sigue con campaña, misiones e investigacion." }
];

let profile = loadProfile();
let state = createStateFromProfile();
let selectedTowerId = null;
let lastTimestamp = 0;
let rewardPendingForWave = 0;
let effects = [];
let runRecorded = false;
let isPaused = false;
let speedMultiplier = 1;
let gameOverShown = false;
let activeDailyChallenge = null;

const sound = new SoundEngine({ muted: profile.muted });
const ui = createUi(elements, {
  onStartWave: () => startWaveFromInput(),
  onRestart: () => restartGame(),
  onToggleMute: () => toggleMute(),
  onToggleContrast: () => toggleContrast(),
  onToggleColorMode: () => toggleColorMode(),
  onToggleReducedMotion: () => toggleReducedMotion(),
  onToggleLargeText: () => toggleLargeText(),
  onTogglePractice: () => togglePractice(),
  onResetProgress: () => resetProgress(),
  onDifficulty: (difficultyId) => chooseDifficulty(difficultyId),
  onTowerSelect: (towerId) => selectTower(towerId),
  onReward: (rewardId) => chooseReward(rewardId),
  onTutorialDone: () => completeTutorial(),
  onTogglePause: () => togglePause(),
  onToggleSpeed: () => toggleSpeed(),
  onTargetMode: () => changeSelectedTargetMode(),
  onSellTower: () => sellSelectedTower(),
  onMap: (mapId) => chooseMap(mapId),
  onExportProgress: () => exportCurrentProgress(),
  onImportProgress: () => importProgressFromPrompt(),
  onGameOverRetry: () => restartGame(),
  onCampaignStep: (step) => chooseCampaignStep(step),
  onBuyResearch: (upgradeId) => buyResearch(upgradeId),
  onStartDaily: () => startDailyChallenge(),
  onStartPracticeWave: (options) => startPracticeWave(options),
  onPracticeEnergy: () => practiceGrantEnergy(),
  onPracticeDamage: () => practiceDamageCore(),
  onPracticeClear: () => practiceClearEnemies(),
  onPracticeUnlock: () => practiceUnlockTowers()
});

bindCanvas();
bindKeyboard();
applyAccessibilityPreferences();
renderUi();
requestAnimationFrame(loop);

function createStateFromProfile() {
  const nextState = createGameState({
    difficultyId: profile.difficultyId,
    mapId: profile.mapId,
    upgrades: profile.researchUpgrades,
    dailyModifier: activeDailyChallenge?.modifier || null
  });
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
    profile = syncProfileFromState();
    ui.showRewards(state);
  }

  if (state.lives <= 0 && !gameOverShown) {
    profile = syncProfileFromState();
    if (!profile.practiceMode) {
      profile = awardResearch(profile, state);
    }
    ui.showGameOver(state, profile);
    gameOverShown = true;
  }

  renderer.render(state, { selectedTowerId, effects, colorMode: profile.colorMode });
  renderUi();
  requestAnimationFrame(loop);
}

function startWaveFromInput() {
  sound.resume();
  ui.hideRewards();
  if (!runRecorded && state.wave === 0) {
    if (!profile.practiceMode) {
      profile = recordNewRun(profile, state.difficultyId, state.mapId);
    }
    runRecorded = true;
  }
  startNextWave(state);
  processEvents();
  renderUi();
}

function restartGame() {
  if (!profile.practiceMode) {
    profile = syncProfileFromState();
  }
  state = createStateFromProfile();
  selectedTowerId = null;
  rewardPendingForWave = 0;
  effects = [];
  runRecorded = false;
  isPaused = false;
  speedMultiplier = 1;
  gameOverShown = false;
  ui.hideRewards();
  ui.hideGameOver();
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

function chooseMap(mapId) {
  sound.resume();
  if (setMap(state, mapId)) {
    profile = setPreferredMap(profile, mapId);
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
    profile = syncProfileFromState();
  }
  ui.hideRewards();
  processEvents();
  renderUi();
}

function sellSelectedTower() {
  if (!selectedTowerId) {
    state.message = "Selecciona una torre para venderla.";
    renderUi();
    return;
  }
  if (sellTower(state, selectedTowerId)) {
    selectedTowerId = null;
    processEvents();
  }
  renderUi();
}

function toggleMute() {
  profile = setMuted(profile, !profile.muted);
  sound.setMuted(profile.muted);
  renderUi();
}

function toggleContrast() {
  profile = setHighContrast(profile, !profile.highContrast);
  applyAccessibilityPreferences();
  renderUi();
}

function toggleColorMode() {
  const modes = ["default", "protanopia", "deuteranopia"];
  const currentIndex = modes.indexOf(profile.colorMode || "default");
  profile = setColorMode(profile, modes[(currentIndex + 1) % modes.length]);
  applyAccessibilityPreferences();
  renderUi();
}

function toggleReducedMotion() {
  profile = setReducedMotion(profile, !profile.reducedMotion);
  applyAccessibilityPreferences();
  renderUi();
}

function toggleLargeText() {
  profile = setLargeText(profile, !profile.largeText);
  applyAccessibilityPreferences();
  renderUi();
}

function togglePractice() {
  if (state.wave > 0 || state.towers.length > 0 || state.activeWave) {
    state.message = "Cambia modo practica antes de iniciar o reinicia la simulacion.";
    renderUi();
    return;
  }
  profile = setPracticeMode(profile, !profile.practiceMode);
  state.message = profile.practiceMode ? "Modo practica activo: no afecta records ni campana." : "Modo practica desactivado.";
  renderUi();
}

function resetProgress() {
  if (!window.confirm("Esto reinicia progreso local. Se creara un backup antes de resetear. Continuar?")) {
    return;
  }
  backupProfile(profile);
  profile = resetProfile();
  state = createStateFromProfile();
  selectedTowerId = null;
  rewardPendingForWave = 0;
  gameOverShown = false;
  applyAccessibilityPreferences();
  state.message = "Progreso reiniciado. Backup local creado.";
  renderUi();
}

function chooseCampaignStep(step) {
  if (!step.unlocked) {
    state.message = "Completa la etapa anterior para desbloquear esta campana.";
    renderUi();
    return;
  }
  if (state.wave > 0 || state.towers.length > 0 || state.activeWave) {
    state.message = "Reinicia la simulacion antes de cambiar a una etapa de campana.";
    renderUi();
    return;
  }
  chooseDifficulty(step.difficultyId);
  chooseMap(step.mapId);
  state.message = `Campana: ${step.title}. Objetivo: oleada ${step.goalWave}.`;
  renderUi();
}

function startDailyChallenge() {
  if (state.wave > 0 || state.towers.length > 0 || state.activeWave) {
    state.message = "Reinicia antes de iniciar el desafio diario.";
    renderUi();
    return;
  }
  activeDailyChallenge = getDailyChallenge();
  chooseDifficulty(activeDailyChallenge.difficultyId);
  chooseMap(activeDailyChallenge.mapId);
  state.dailyModifier = activeDailyChallenge.modifier;
  state.message = `Desafio diario: ${activeDailyChallenge.modifier.name}. Objetivo oleada ${activeDailyChallenge.objective}.`;
  renderUi();
}

function startPracticeWave(options) {
  if (!profile.practiceMode) {
    state.message = "Activa modo practica para usar el editor de oleadas.";
    renderUi();
    return;
  }
  if (state.activeWave || state.enemies.length > 0) {
    state.message = "Espera a terminar la oleada actual antes de probar otra.";
    renderUi();
    return;
  }
  const wave = Math.max(1, Number(options.wave || 1));
  state.wave = wave - 1;
  startNextWave(state);
  if (options.enemyType && options.enemyType !== "mixed") {
    state.waveQueue = state.waveQueue.map((item) => ({ ...item, typeId: options.enemyType }));
  }
  state.waveTotal = state.waveQueue.length;
  state.message = `Practica: oleada ${wave} con ${options.enemyType === "mixed" ? "mezcla de amenazas" : options.enemyType}.`;
  processEvents();
  renderUi();
}

function practiceGrantEnergy() {
  if (!ensurePracticeMode()) {
    return;
  }
  state.money += 100;
  state.message = "Practica: +100 energia.";
  renderUi();
}

function practiceDamageCore() {
  if (!ensurePracticeMode()) {
    return;
  }
  state.lives = Math.max(0, state.lives - 1);
  state.message = "Practica: nucleo danado para probar fin de partida.";
  renderUi();
}

function practiceClearEnemies() {
  if (!ensurePracticeMode()) {
    return;
  }
  state.enemies = [];
  state.waveQueue = [];
  state.activeWave = false;
  state.message = "Practica: enemigos limpiados.";
  renderUi();
}

function practiceUnlockTowers() {
  if (!ensurePracticeMode()) {
    return;
  }
  state.unlockedTowerTypes = Object.keys(TOWER_TYPES);
  state.message = "Practica: todas las defensas desbloqueadas temporalmente.";
  renderUi();
}

function ensurePracticeMode() {
  if (!profile.practiceMode) {
    state.message = "Activa modo practica para usar esta herramienta.";
    renderUi();
    return false;
  }
  return true;
}

function buyResearch(upgradeId) {
  if (state.wave > 0 || state.towers.length > 0 || state.activeWave) {
    state.message = "La investigacion se compra antes de iniciar una simulacion.";
    renderUi();
    return;
  }
  const upgrade = RESEARCH_UPGRADES[upgradeId];
  if (!upgrade) {
    return;
  }
  const currentLevel = profile.researchUpgrades?.[upgradeId] || 0;
  const cost = getResearchUpgradeCost(upgradeId, currentLevel);
  profile = buyResearchUpgrade(profile, upgradeId, cost, upgrade.maxLevel);
  state = createStateFromProfile();
  selectedTowerId = null;
  state.message = "Investigacion aplicada a la siguiente simulacion.";
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
  if (isPathCellForState(state, col, row)) {
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
  updateGuidedTutorial(events);
  events.forEach((event) => {
    if (event.type === "unlock" || event.type === "wave-complete") {
      profile = syncProfileFromState();
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

function updateGuidedTutorial(events) {
  if (profile.guidedTutorialComplete) {
    return;
  }

  const stepIndex = profile.guidedTutorialStep || 0;
  const step = GUIDED_TUTORIAL[stepIndex];
  if (!step || !events.some((event) => event.type === step.eventType)) {
    return;
  }

  const nextIndex = stepIndex + 1;
  profile = {
    ...profile,
    guidedTutorialStep: nextIndex,
    guidedTutorialComplete: nextIndex >= GUIDED_TUTORIAL.length
  };
  saveProfile(profile);
  state.message = step.message;
}

function renderUi() {
  ui.render(state, profile, selectedTowerId, {
    isPaused,
    speedMultiplier,
    missions: evaluateMissions(profile, state).missionStates,
    campaign: getCampaignStatus(profile),
    researchUpgrades: RESEARCH_UPGRADES,
    dailyChallenge: activeDailyChallenge || getDailyChallenge(),
    balanceSuggestions: getBalanceSuggestions(profile, state),
    mapAnalysis: getMapAnalysis(profile, state.mapId)
  });
}

function applyAccessibilityPreferences() {
  document.body.classList.toggle("high-contrast", Boolean(profile.highContrast));
  document.body.dataset.colorMode = profile.colorMode || "default";
  document.body.classList.toggle("reduced-motion", Boolean(profile.reducedMotion));
  document.body.classList.toggle("large-text", Boolean(profile.largeText));
}

function syncProfileFromState() {
  if (profile.practiceMode) {
    return profile;
  }
  let nextProfile = updateProfileFromState(profile, state);
  const achievementResult = evaluateAchievements(nextProfile, state);
  const missionResult = evaluateMissions(nextProfile, state);
  const campaignResult = evaluateCampaign(nextProfile, state);
  nextProfile = {
    ...nextProfile,
    achievements: achievementResult.achievements,
    completedMissions: missionResult.completedMissions,
    completedCampaignSteps: campaignResult.completedCampaignSteps
  };
  nextProfile = updateBalanceMetrics(nextProfile, state);
  saveProfile(nextProfile);
  return nextProfile;
}

async function exportCurrentProgress() {
  const serialized = exportProfile(syncProfileFromState());
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(serialized);
    state.message = "Progreso exportado al portapapeles.";
  } else {
    window.prompt("Copia tu progreso:", serialized);
    state.message = "Progreso listo para copiar.";
  }
  renderUi();
}

function importProgressFromPrompt() {
  const serialized = window.prompt("Pega aqui el JSON de progreso:");
  if (!serialized) {
    return;
  }

  try {
    if (!window.confirm("Importar sobrescribira el progreso actual. Se creara un backup antes de continuar.")) {
      return;
    }
    backupProfile(profile);
    profile = importProfile(serialized);
    saveProfile(profile);
    state = createStateFromProfile();
    selectedTowerId = null;
    rewardPendingForWave = 0;
    gameOverShown = false;
    ui.hideRewards();
    ui.hideGameOver();
    state.message = "Progreso importado correctamente.";
  } catch {
    state.message = "No se pudo importar: JSON invalido.";
  }
  renderUi();
}

function updateEffects(deltaSeconds) {
  effects.forEach((effect) => {
    effect.age += deltaSeconds;
  });
  effects = effects.filter((effect) => effect.age < effect.duration).slice(-80);
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
