import {
  DIFFICULTY_PRESETS,
  ENEMY_TYPES,
  TOWER_TYPES,
  getUpgradeCost,
  getWaveProgress,
  isTowerUnlocked,
  previewWave
} from "./gameLogic.js";

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

  elements.startWave.addEventListener("click", callbacks.onStartWave);
  elements.restart.addEventListener("click", callbacks.onRestart);
  elements.muteToggle.addEventListener("click", callbacks.onToggleMute);
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
    render(state, profile, selectedTowerId) {
      renderHud(elements, state, profile, selectedTowerId);
      const nextDifficultySignature = `${state.difficultyId}:${state.wave}:${state.towers.length}:${state.activeWave}`;
      if (nextDifficultySignature !== difficultySignature) {
        renderDifficultyCards(elements, state, callbacks.onDifficulty);
        difficultySignature = nextDifficultySignature;
      }
      const nextTowerSignature = `${state.selectedTowerType}:${state.money}:${state.unlockedTowerTypes.join(",")}`;
      if (nextTowerSignature !== towerSignature) {
        renderTowerCards(elements, state, callbacks.onTowerSelect);
        towerSignature = nextTowerSignature;
      }
      renderProfile(elements, profile);
    },
    showRewards(state) {
      renderRewards(elements, state, callbacks.onReward);
      elements.rewardPanel.hidden = false;
    },
    hideRewards() {
      elements.rewardPanel.hidden = true;
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
    startWave: document.querySelector("#start-wave"),
    restart: document.querySelector("#restart"),
    muteToggle: document.querySelector("#mute-toggle"),
    rewardPanel: document.querySelector("#reward-panel"),
    rewardCards: document.querySelector("#reward-cards"),
    selectedInfo: document.querySelector("#selected-info"),
    profileInfo: document.querySelector("#profile-info"),
    waveProgressBar: document.querySelector("#wave-progress-bar"),
    waveProgressLabel: document.querySelector("#wave-progress-label"),
    tutorialPanel: document.querySelector("#tutorial-panel"),
    tutorialTitle: document.querySelector("#tutorial-title"),
    tutorialBody: document.querySelector("#tutorial-body"),
    tutorialNext: document.querySelector("#tutorial-next"),
    tutorialSkip: document.querySelector("#tutorial-skip")
  };
}

function renderHud(elements, state, profile, selectedTowerId) {
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

  const progress = getWaveProgress(state);
  elements.waveProgressBar.style.width = `${Math.round(progress * 100)}%`;
  elements.waveProgressLabel.textContent = state.activeWave
    ? `Oleada ${state.wave}: ${state.waveResolved}/${state.waveTotal} amenazas resueltas`
    : "Oleada en espera";

  const selected = state.towers.find((tower) => tower.id === selectedTowerId);
  if (selected) {
    elements.selectedInfo.textContent = `${TOWER_TYPES[selected.typeId].name} nivel ${selected.level}. Upgrade: ${getUpgradeCost(selected)} energia.`;
  } else {
    const tower = TOWER_TYPES[state.selectedTowerType];
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
  elements.profileInfo.textContent = `Partidas: ${profile.totalRuns || 0}. Record: ${profile.bestScore || 0}. Maxima oleada: ${profile.maxWave || 0}.`;
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
  return Object.entries(previewWave(nextWave, state.lastWaveLeaks, state.difficultyId))
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

function hideTutorial(elements) {
  elements.tutorialPanel.hidden = true;
}
