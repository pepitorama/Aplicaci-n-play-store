const STORAGE_KEY = "defiende-nucleo-pc-profile-v1";

export const DEFAULT_PROFILE = {
  bestScore: 0,
  maxWave: 0,
  totalRuns: 0,
  tutorialSeen: false,
  guidedTutorialComplete: false,
  muted: false,
  highContrast: false,
  reducedMotion: false,
  largeText: false,
  difficultyId: "normal",
  mapId: "classic",
  unlockedTowerTypes: ["packet", "firewall", "freezer"],
  achievements: [],
  completedMissions: [],
  mapsPlayed: [],
  perMapStats: {},
  recordsByDifficulty: {},
  bestPerfectStreak: 0,
  killsByType: {},
  totalKills: 0,
  researchPoints: 0,
  researchUpgrades: {},
  completedCampaignSteps: []
};

export function loadProfile() {
  if (!isStorageAvailable()) {
    return { ...DEFAULT_PROFILE };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { ...DEFAULT_PROFILE };
    }
    return {
      ...DEFAULT_PROFILE,
      ...JSON.parse(stored)
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile) {
  if (!isStorageAvailable()) {
    return false;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULT_PROFILE, ...profile }));
  return true;
}

export function markTutorialSeen(profile) {
  const nextProfile = { ...profile, tutorialSeen: true };
  saveProfile(nextProfile);
  return nextProfile;
}

export function updateProfileFromState(profile, state) {
  const unlocked = Array.from(new Set([...(profile.unlockedTowerTypes || []), ...(state.unlockedTowerTypes || [])]));
  const killsByType = mergeCounts(profile.killsByType || {}, state.killsByType || {});
  const mapsPlayed = Array.from(new Set([...(profile.mapsPlayed || []), state.mapId].filter(Boolean)));
  const previousMapStats = profile.perMapStats?.[state.mapId] || {};
  const perMapStats = {
    ...(profile.perMapStats || {}),
    [state.mapId]: {
      bestScore: Math.max(previousMapStats.bestScore || 0, state.score || 0),
      maxWave: Math.max(previousMapStats.maxWave || 0, state.maxWaveReached || state.wave || 0),
      runs: previousMapStats.runs || 0
    }
  };
  const previousDifficultyStats = profile.recordsByDifficulty?.[state.difficultyId] || {};
  const recordsByDifficulty = {
    ...(profile.recordsByDifficulty || {}),
    [state.difficultyId]: {
      bestScore: Math.max(previousDifficultyStats.bestScore || 0, state.score || 0),
      maxWave: Math.max(previousDifficultyStats.maxWave || 0, state.maxWaveReached || state.wave || 0)
    }
  };
  const nextProfile = {
    ...profile,
    bestScore: Math.max(profile.bestScore || 0, state.score || 0),
    maxWave: Math.max(profile.maxWave || 0, state.maxWaveReached || state.wave || 0),
    difficultyId: state.difficultyId || profile.difficultyId,
    mapId: state.mapId || profile.mapId,
    unlockedTowerTypes: unlocked,
    mapsPlayed,
    perMapStats,
    recordsByDifficulty,
    bestPerfectStreak: Math.max(profile.bestPerfectStreak || 0, state.focusStreak || 0, state.perfectWaves || 0),
    killsByType,
    totalKills: Math.max(profile.totalKills || 0, state.totalKills || 0)
  };
  saveProfile(nextProfile);
  return nextProfile;
}

export function recordNewRun(profile, difficultyId, mapId = profile.mapId) {
  const previousMapStats = profile.perMapStats?.[mapId] || {};
  const nextProfile = {
    ...profile,
    totalRuns: (profile.totalRuns || 0) + 1,
    difficultyId,
    mapId,
    perMapStats: {
      ...(profile.perMapStats || {}),
      [mapId]: {
        ...previousMapStats,
        runs: (previousMapStats.runs || 0) + 1
      }
    }
  };
  saveProfile(nextProfile);
  return nextProfile;
}

export function setPreferredMap(profile, mapId) {
  const nextProfile = { ...profile, mapId };
  saveProfile(nextProfile);
  return nextProfile;
}

export function setMuted(profile, muted) {
  const nextProfile = { ...profile, muted };
  saveProfile(nextProfile);
  return nextProfile;
}

export function setHighContrast(profile, highContrast) {
  const nextProfile = { ...profile, highContrast };
  saveProfile(nextProfile);
  return nextProfile;
}

export function setReducedMotion(profile, reducedMotion) {
  const nextProfile = { ...profile, reducedMotion };
  saveProfile(nextProfile);
  return nextProfile;
}

export function setLargeText(profile, largeText) {
  const nextProfile = { ...profile, largeText };
  saveProfile(nextProfile);
  return nextProfile;
}

export function awardResearch(profile, state) {
  const gained = Math.max(1, Math.floor((state.maxWaveReached || 0) / 2) + Math.floor((state.score || 0) / 1500));
  const nextProfile = {
    ...profile,
    researchPoints: (profile.researchPoints || 0) + gained,
    lastResearchAward: gained
  };
  saveProfile(nextProfile);
  return nextProfile;
}

export function buyResearchUpgrade(profile, upgradeId, cost, maxLevel) {
  const currentLevel = profile.researchUpgrades?.[upgradeId] || 0;
  if (currentLevel >= maxLevel || (profile.researchPoints || 0) < cost) {
    return profile;
  }

  const nextProfile = {
    ...profile,
    researchPoints: (profile.researchPoints || 0) - cost,
    researchUpgrades: {
      ...(profile.researchUpgrades || {}),
      [upgradeId]: currentLevel + 1
    }
  };
  saveProfile(nextProfile);
  return nextProfile;
}

export function exportProfile(profile) {
  return JSON.stringify(
    {
      ...DEFAULT_PROFILE,
      ...profile,
      exportedAt: new Date().toISOString()
    },
    null,
    2
  );
}

export function importProfile(serializedProfile) {
  const parsed = JSON.parse(serializedProfile);
  return {
    ...DEFAULT_PROFILE,
    ...parsed,
    importedAt: new Date().toISOString()
  };
}

function isStorageAvailable() {
  return typeof localStorage !== "undefined";
}

function mergeCounts(left, right) {
  const merged = { ...left };
  Object.entries(right).forEach(([key, value]) => {
    merged[key] = Math.max(merged[key] || 0, value || 0);
  });
  return merged;
}
