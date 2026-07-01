export const ACHIEVEMENTS = {
  firstDefense: {
    id: "firstDefense",
    title: "Primer despliegue",
    description: "Coloca tu primera defensa.",
    isComplete: (state) => state.towers.length > 0 || totalPlaced(state) > 0
  },
  perfectWave: {
    id: "perfectWave",
    title: "Oleada limpia",
    description: "Completa una oleada sin fugas.",
    isComplete: (state) => state.perfectWaves > 0
  },
  malwareHunter: {
    id: "malwareHunter",
    title: "Cazador de malware",
    description: "Derrota 100 amenazas en total.",
    isComplete: (state, profile) => Math.max(state.totalKills || 0, profile.totalKills || 0) >= 100
  },
  sentinelUnlocked: {
    id: "sentinelUnlocked",
    title: "IA activada",
    description: "Desbloquea la IA Centinela.",
    isComplete: (state, profile) =>
      (state.unlockedTowerTypes || []).includes("tesla") || (profile.unlockedTowerTypes || []).includes("tesla")
  },
  mapExplorer: {
    id: "mapExplorer",
    title: "Explorador de mapas",
    description: "Juega en al menos 3 mapas distintos.",
    isComplete: (state, profile) => new Set([...(profile.mapsPlayed || []), state.mapId].filter(Boolean)).size >= 3
  }
};

export const MISSIONS = {
  surviveFive: {
    id: "surviveFive",
    title: "Sobrevive 5 oleadas",
    description: "Alcanza la oleada 5 en cualquier mapa.",
    getProgress: (state) => Math.min(5, state.maxWaveReached || state.wave || 0),
    target: 5
  },
  sandboxControl: {
    id: "sandboxControl",
    title: "Control con Sandbox",
    description: "Coloca 3 Sandboxes en una partida.",
    getProgress: (state) => Math.min(3, state.towersPlacedByType?.freezer || 0),
    target: 3
  },
  spywareSweep: {
    id: "spywareSweep",
    title: "Limpia Spyware",
    description: "Derrota 20 Spyware.",
    getProgress: (state, profile) => Math.min(20, (state.killsByType?.spyware || 0) + (profile.killsByType?.spyware || 0)),
    target: 20
  },
  perfectFocus: {
    id: "perfectFocus",
    title: "Foco perfecto",
    description: "Completa 2 oleadas perfectas.",
    getProgress: (state) => Math.min(2, state.perfectWaves || 0),
    target: 2
  }
};

export function evaluateAchievements(profile, state) {
  const completed = new Set(profile.achievements || []);
  const newlyCompleted = [];

  Object.values(ACHIEVEMENTS).forEach((achievement) => {
    if (!completed.has(achievement.id) && achievement.isComplete(state, profile)) {
      completed.add(achievement.id);
      newlyCompleted.push(achievement.id);
    }
  });

  return {
    achievements: Array.from(completed),
    newlyCompleted
  };
}

export function evaluateMissions(profile, state) {
  const completed = new Set(profile.completedMissions || []);
  const missionStates = Object.values(MISSIONS).map((mission) => {
    const progress = mission.getProgress(state, profile);
    const complete = progress >= mission.target;
    if (complete) {
      completed.add(mission.id);
    }
    return {
      ...mission,
      progress,
      complete
    };
  });

  return {
    completedMissions: Array.from(completed),
    missionStates
  };
}

export function getProfileSummary(profile) {
  return {
    achievements: profile.achievements?.length || 0,
    missions: profile.completedMissions?.length || 0,
    maps: profile.mapsPlayed?.length || 0
  };
}

function totalPlaced(state) {
  return Object.values(state.towersPlacedByType || {}).reduce((total, count) => total + count, 0);
}
