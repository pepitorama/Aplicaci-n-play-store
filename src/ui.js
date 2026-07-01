import {
  DIFFICULTY_PRESETS,
  ENEMY_TYPES,
  MAPS,
  TARGET_MODES,
  TOWER_TYPES,
  getTowerSellValue,
  getUpgradeCost,
  getWaveProgress,
  isTowerUnlocked,
  previewWave
} from "./gameLogic.js";
import { ACHIEVEMENTS, getProfileSummary } from "./progression.js";

const TUTORIAL_STEPS = [
  {
    title: "1. Observa la ruta",
    body: "Los ataques siguen la linea verde. Coloca defensas cerca de curvas para que disparen mas tiempo."
  },
  {
    title: "2. Lee la oleada",
    body: "La vista previa te dice que viene despues. Combina Analizador, Firewall y Sandbox para cubrir velocidad, resistencia y control."
  },
  {
    title: "3. Mejora y recompensa",
    body: "Click en una torre para subirla de nivel. Al terminar cada oleada elige una micro-recompensa para mantener el ritmo."
  }
];

export function createUi(elements, callbacks) {
  let tutorialIndex = 0;
  let towerSignature = "";
  let difficultySignature = "";
  let mapSignature = "";
  let progressSignature = "";

  elements.startWave.addEventListener("click", callbacks.onStartWave);
  elements.restart.addEventListener("click", callbacks.onRestart);
  elements.muteToggle.addEventListener("click", callbacks.onToggleMute);
  elements.contrastToggle.addEventListener("click", callbacks.onToggleContrast);
  elements.pauseToggle.addEventListener("click", callbacks.onTogglePause);
  elements.speedToggle.addEventListener("click", callbacks.onToggleSpeed);
  elements.targetToggle.addEventListener("click", callbacks.onTargetMode);
  elements.sellTower.addEventListener("click", callbacks.onSellTower);
  elements.exportProgress.addEventListener("click", callbacks.onExportProgress);
  elements.importProgress.addEventListener("click", callbacks.onImportProgress);
  elements.gameOverRetry.addEventListener("click", callbacks.onGameOverRetry);
  elements.gameOverClose.addEventListener("click", () => {
    elements.gameOverPanel.hidden = true;
  });
  elements.startPlay.addEventListener("click", () => {
    elements.startPanel.hidden = true;
  });
  elements.startTutorial.addEventListener("click", () => {
    elements.startPanel.hidden = true;
    tutorialIndex = 0;
    renderTutorial(elements, tutorialIndex);
    elements.tutorialPanel.hidden = false;
  });
  elements.startProgress.addEventListener("click", () => {
    elements.startPanel.hidden = true;
    elements.missionList.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  elements.tutorialNext.addEventListener("click", () => {
    tutorialIndex += 1;
    if (tutorialIndex >= TUTORIAL_STEPS.length) {
      callbacks.onTutorialDone();
      hideTutorial(elements);
      return;
    }
    renderTutorial(elements, tutorialIndex);
  });
  elements.tutorialSkip.addEventListener("click", () => {
    callbacks.onTutorialDone();
    hideTutorial(elements);
  });

  return {
    showTutorial() {
      tutorialIndex = 0;
      renderTutorial(elements, tutorialIndex);
      elements.tutorialPanel.hidden = false;
    },
    hideTutorial() {
      hideTutorial(elements);
    },
    render(state, profile, selectedTowerId, session = {}) {
      renderHud(elements, state, profile, selectedTowerId, session);
      const nextDifficultySignature = `${state.difficultyId}:${state.wave}:${state.towers.length}:${state.activeWave}`;
      if (nextDifficultySignature !== difficultySignature) {
        renderDifficultyCards(elements, state, callbacks.onDifficulty);
        difficultySignature = nextDifficultySignature;
      }
      const nextMapSignature = `${state.mapId}:${state.wave}:${state.towers.length}:${state.activeWave}`;
      if (nextMapSignature !== mapSignature) {
        renderMapCards(elements, state, profile, callbacks.onMap);
        mapSignature = nextMapSignature;
      }
      const nextTowerSignature = `${state.selectedTowerType}:${state.money}:${state.unlockedTowerTypes.join(",")}`;
      if (nextTowerSignature !== towerSignature) {
        renderTowerCards(elements, state, callbacks.onTowerSelect);
        towerSignature = nextTowerSignature;
      }
      const nextProgressSignature = `${profile.achievements?.join(",")}:${profile.completedMissions?.join(",")}:${state.totalKills}:${state.maxWaveReached}:${state.perfectWaves}`;
      if (nextProgressSignature !== progressSignature) {
        renderProgress(elements, state, profile, session.missions || []);
        progressSignature = nextProgressSignature;
      }
      renderProfile(elements, profile);
    },
    showRewards(state) {
      renderRewards(elements, state, callbacks.onReward);
      elements.rewardPanel.hidden = false;
    },
    hideRewards() {
      elements.rewardPanel.hidden = true;
    },
    showGameOver(state, profile) {
      renderGameOver(elements, state, profile);
      elements.gameOverPanel.hidden = false;
    },
    hideGameOver() {
      elements.gameOverPanel.hidden = true;
    },
    hideStart() {
      elements.startPanel.hidden = true;
    }
  };
}

export function collectUiElements() {
  return {
    money: document.querySelector("#money"),
    lives: document.querySelector("#lives"),
    wave: document.querySelector("#wave"),
    score: document.querySelector("#score"),
    bestScore: document.querySelector("#best-score"),
    maxWave: document.querySelector("#max-wave"),
    message: document.querySelector("#message"),
    preview: document.querySelector("#wave-preview"),
    towerCards: document.querySelector("#tower-cards"),
    difficultyCards: document.querySelector("#difficulty-cards"),
    mapCards: document.querySelector("#map-cards"),
    startWave: document.querySelector("#start-wave"),
    startPanel: document.querySelector("#start-panel"),
    startPlay: document.querySelector("#start-play"),
    startTutorial: document.querySelector("#start-tutorial"),
    startProgress: document.querySelector("#start-progress"),
    restart: document.querySelector("#restart"),
    pauseToggle: document.querySelector("#pause-toggle"),
    speedToggle: document.querySelector("#speed-toggle"),
    targetToggle: document.querySelector("#target-toggle"),
    sellTower: document.querySelector("#sell-tower"),
    muteToggle: document.querySelector("#mute-toggle"),
    contrastToggle: document.querySelector("#contrast-toggle"),
    rewardPanel: document.querySelector("#reward-panel"),
    rewardCards: document.querySelector("#reward-cards"),
    selectedInfo: document.querySelector("#selected-info"),
    profileInfo: document.querySelector("#profile-info"),
    missionList: document.querySelector("#mission-list"),
    achievementList: document.querySelector("#achievement-list"),
    exportProgress: document.querySelector("#export-progress"),
    importProgress: document.querySelector("#import-progress"),
    gameOverPanel: document.querySelector("#game-over-panel"),
    gameOverSummary: document.querySelector("#game-over-summary"),
    gameOverRetry: document.querySelector("#game-over-retry"),
    gameOverClose: document.querySelector("#game-over-close"),
    waveProgressBar: document.querySelector("#wave-progress-bar"),
    waveProgressLabel: document.querySelector("#wave-progress-label"),
    tutorialPanel: document.querySelector("#tutorial-panel"),
    tutorialTitle: document.querySelector("#tutorial-title"),
    tutorialBody: document.querySelector("#tutorial-body"),
    tutorialNext: document.querySelector("#tutorial-next"),
    tutorialSkip: document.querySelector("#tutorial-skip")
  };
}

function renderHud(elements, state, profile, selectedTowerId, session) {
  elements.money.textContent = state.money;
  elements.lives.textContent = state.lives;
  elements.wave.textContent = state.wave;
  elements.score.textContent = state.score;
  elements.bestScore.textContent = profile.bestScore || 0;
  elements.maxWave.textContent = profile.maxWave || 0;
  elements.message.textContent = state.message;
  elements.startWave.disabled = state.activeWave || state.enemies.length > 0 || state.lives <= 0;
  elements.preview.innerHTML = previewHtml(state);
  elements.muteToggle.textContent = profile.muted ? "Sonido: OFF" : "Sonido: ON";
  elements.contrastToggle.textContent = profile.highContrast ? "Contraste: Alto" : "Contraste";
  elements.pauseToggle.textContent = session.isPaused ? "Continuar" : "Pausar";
  elements.pauseToggle.disabled = state.lives <= 0;
  elements.speedToggle.textContent = `Velocidad x${session.speedMultiplier || 1}`;
  elements.targetToggle.disabled = !selectedTowerId;
  elements.sellTower.disabled = !selectedTowerId;

  const progress = getWaveProgress(state);
  elements.waveProgressBar.style.width = `${Math.round(progress * 100)}%`;
  elements.waveProgressLabel.textContent = state.activeWave
    ? `Oleada ${state.wave}: ${state.waveResolved}/${state.waveTotal} amenazas resueltas`
    : "Oleada en espera";

  const selected = state.towers.find((tower) => tower.id === selectedTowerId);
  if (selected) {
    elements.targetToggle.textContent = `Prioridad: ${TARGET_MODES[selected.targetMode || "first"].name}`;
    elements.sellTower.textContent = `Vender +${getTowerSellValue(selected)}`;
    elements.selectedInfo.innerHTML = towerStatsHtml(selected);
  } else {
    const tower = TOWER_TYPES[state.selectedTowerType];
    elements.targetToggle.textContent = "Prioridad";
    elements.sellTower.textContent = "Vender";
    elements.selectedInfo.textContent = `Colocando ${tower.name}. Click en casilla libre; click en una torre para mejorar.`;
  }
}

function renderDifficultyCards(elements, state, onDifficulty) {
  elements.difficultyCards.innerHTML = "";
  Object.values(DIFFICULTY_PRESETS).forEach((difficulty) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `difficulty-card ${state.difficultyId === difficulty.id ? "selected" : ""}`;
    button.disabled = state.wave > 0 || state.towers.length > 0 || state.activeWave;
    button.innerHTML = `
      <strong>${difficulty.name}</strong>
      <span>${difficulty.startingLives} integridad</span>
      <small>${difficulty.startingMoney} energia inicial, x${difficulty.enemyHealth.toFixed(2)} vida enemiga.</small>
    `;
    button.addEventListener("click", () => onDifficulty(difficulty.id));
    elements.difficultyCards.append(button);
  });
}

function renderMapCards(elements, state, profile, onMap) {
  elements.mapCards.innerHTML = "";
  Object.values(MAPS).forEach((map) => {
    const stats = profile.perMapStats?.[map.id] || {};
    const button = document.createElement("button");
    button.type = "button";
    button.className = `map-card ${state.mapId === map.id ? "selected" : ""}`;
    button.disabled = state.wave > 0 || state.towers.length > 0 || state.activeWave;
    button.innerHTML = `
      <strong>${map.name}</strong>
      <span>${map.difficulty}</span>
      <small>${map.description}</small>
      <small>Recompensa x${map.modifiers.reward} | Velocidad x${map.modifiers.enemySpeed} | Record ${stats.bestScore || 0}</small>
    `;
    button.addEventListener("click", () => onMap(map.id));
    elements.mapCards.append(button);
  });
}

function renderTowerCards(elements, state, onTowerSelect) {
  elements.towerCards.innerHTML = "";
  Object.values(TOWER_TYPES).forEach((tower, index) => {
    const unlocked = isTowerUnlocked(state, tower.id);
    const button = document.createElement("button");
    button.type = "button";
    button.disabled = !unlocked;
    button.className = `tower-card ${state.selectedTowerType === tower.id ? "selected" : ""} ${unlocked ? "" : "locked"}`;
    button.innerHTML = `
      <span class="tower-chip" style="--tower-color:${tower.color}">${tower.shortName}</span>
      <span class="tower-name">${tower.name}</span>
      <span class="tower-cost">${tower.cost} energia</span>
      <small>${unlocked ? tower.description : `Se desbloquea en oleada ${tower.unlockWave}.`}</small>
      <kbd>${index + 1}</kbd>
    `;
    button.addEventListener("click", () => onTowerSelect(tower.id));
    elements.towerCards.append(button);
  });
}

function renderProfile(elements, profile) {
  const summary = getProfileSummary(profile);
  elements.profileInfo.textContent = `Partidas: ${profile.totalRuns || 0}. Record: ${profile.bestScore || 0}. Maxima oleada: ${profile.maxWave || 0}. Logros: ${summary.achievements}. Misiones: ${summary.missions}.`;
}

function renderProgress(elements, state, profile, missions) {
  elements.missionList.innerHTML = missions
    .map(
      (mission) => `
        <article class="progress-item ${mission.complete ? "complete" : ""}">
          <strong>${mission.title}</strong>
          <span>${mission.description}</span>
          <small>${mission.progress}/${mission.target}</small>
        </article>
      `
    )
    .join("");

  elements.achievementList.innerHTML = Object.values(ACHIEVEMENTS)
    .map((achievement) => {
      const complete = (profile.achievements || []).includes(achievement.id) || achievement.isComplete(state, profile);
      return `
        <article class="progress-item ${complete ? "complete" : ""}">
          <strong>${achievement.title}</strong>
          <span>${achievement.description}</span>
          <small>${complete ? "Completado" : "Pendiente"}</small>
        </article>
      `;
    })
    .join("");
}

function renderRewards(elements, state, onReward) {
  const rewards = [
    ["cache", "Cache tactica", "+45 energia para decidir rapido."],
    ["patch", "Parche critico", "+3 integridad para sostener la sesion."],
    ["overclock", "Overclock", "Todas las defensas ganan un nivel."]
  ];

  if (Object.values(TOWER_TYPES).some((tower) => !isTowerUnlocked(state, tower.id))) {
    rewards.push(["blueprint", "Plano filtrado", "Desbloquea una defensa antes de tiempo."]);
  }

  elements.rewardCards.innerHTML = "";
  rewards.forEach(([id, title, body]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "reward-card";
    button.innerHTML = `<strong>${title}</strong><span>${body}</span>`;
    button.addEventListener("click", () => onReward(id));
    elements.rewardCards.append(button);
  });
}

function previewHtml(state) {
  const nextWave = state.activeWave ? state.wave : state.wave + 1;
  return Object.entries(previewWave(nextWave, state.lastWaveLeaks, state.difficultyId, state.mapId))
    .map(([typeId, count]) => {
      const enemy = ENEMY_TYPES[typeId];
      return `<span class="preview-pill" style="--enemy-color:${enemy.color}">${enemy.name}: ${count}</span>`;
    })
    .join("");
}

function renderTutorial(elements, index) {
  const step = TUTORIAL_STEPS[index];
  elements.tutorialTitle.textContent = step.title;
  elements.tutorialBody.textContent = step.body;
  elements.tutorialNext.textContent = index === TUTORIAL_STEPS.length - 1 ? "Jugar" : "Siguiente";
}

function renderGameOver(elements, state, profile) {
  elements.gameOverSummary.innerHTML = `
    <div><span>Puntuacion final</span><strong>${state.score}</strong></div>
    <div><span>Oleada alcanzada</span><strong>${state.maxWaveReached}</strong></div>
    <div><span>Enemigos derrotados</span><strong>${state.totalKills}</strong></div>
    <div><span>Record guardado</span><strong>${Math.max(profile.bestScore || 0, state.score || 0)}</strong></div>
  `;
}

function towerStatsHtml(tower) {
  const type = TOWER_TYPES[tower.typeId];
  const range = type.range + tower.level * 8;
  const damage = Math.round(type.damage * (1 + (tower.level - 1) * 0.42));
  return `
    <span class="tower-stats-title">${type.name} nivel ${tower.level}</span>
    <span>Dano: ${damage} | Rango: ${range} | Cadencia: ${type.cooldown.toFixed(2)}s</span>
    <span>Upgrade: ${getUpgradeCost(tower)} energia | Venta: ${getTowerSellValue(tower)} energia</span>
    <span>Prioridad: ${TARGET_MODES[tower.targetMode || "first"].description}</span>
  `;
}

function hideTutorial(elements) {
  elements.tutorialPanel.hidden = true;
}
