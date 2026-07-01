const PROFILE_VERSION = 2;
const STORAGE_KEY = "defiende-nucleo-pc-profile-v1";
const BACKUP_KEY = "defiende-nucleo-pc-profile-backup-v1";

export const DEFAULT_PROFILE = {
  version: PROFILE_VERSION,
  bestScore: 0,
  maxWave: 0,
  totalRuns: 0,
  tutorialSeen: false,
  guidedTutorialComplete: false,
  muted: false,
  highContrast: false,
  colorMode: "default",
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
  completedCampaignSteps: [],
  practiceMode: false,
  balanceMetrics: {
    lossesByMap: {},
    totalLosses: 0,
    leakedByEnemy: {},
    lowestResource: null,
    towersUsed: {}
  }
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
    return migrateProfile(JSON.parse(stored));
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile) {
  if (!isStorageAvailable()) {
    return false;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(migrateProfile(profile)));
  return true;
}

export function backupProfile(profile) {
  if (!isStorageAvailable()) {
    return false;
  }
  localStorage.setItem(BACKUP_KEY, JSON.stringify(migrateProfile(profile)));
  return true;
}

export function resetProfile() {
  const nextProfile = { ...DEFAULT_PROFILE };
  saveProfile(nextProfile);
  return nextProfile;
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

export function updateBalanceMetrics(profile, state) {
  const lowestResource = getLowestResource(state.resources || {});
  const leakedByEnemy = mergeCounts(profile.balanceMetrics?.leakedByEnemy || {}, state.leakedByType || {});
  const towersUsed = mergeCounts(profile.balanceMetrics?.towersUsed || {}, state.towersPlacedByType || {});
  const lossesByMap = { ...(profile.balanceMetrics?.lossesByMap || {}) };
  const lost = state.lives <= 0;
  const shouldRecordLoss = lost && !state.balanceMetricsRecorded;
  if (shouldRecordLoss) {
    lossesByMap[state.mapId] = (lossesByMap[state.mapId] || 0) + 1;
    state.balanceMetricsRecorded = true;
  }

  const nextProfile = {
    ...profile,
    balanceMetrics: {
      lossesByMap,
      totalLosses: (profile.balanceMetrics?.totalLosses || 0) + (shouldRecordLoss ? 1 : 0),
      leakedByEnemy,
      lowestResource,
      towersUsed
    }
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

export function setPracticeMode(profile, practiceMode) {
  const nextProfile = { ...profile, practiceMode };
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

export function setColorMode(profile, colorMode) {
  const nextProfile = { ...profile, colorMode };
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
  if (!isPlainObject(parsed)) {
    throw new Error("Invalid profile payload");
  }
  const profile = migrateProfile({
    ...parsed,
    importedAt: new Date().toISOString()
  });
  if (!validateProfile(profile)) {
    throw new Error("Invalid profile shape");
  }
  return profile;
}

export function validateProfile(profile) {
  return (
    isPlainObject(profile) &&
    typeof profile.bestScore === "number" &&
    typeof profile.maxWave === "number" &&
    Array.isArray(profile.unlockedTowerTypes) &&
    isPlainObject(profile.researchUpgrades)
  );
}

function isStorageAvailable() {
  return typeof localStorage !== "undefined";
}

function migrateProfile(profile) {
  const nextProfile = {
    ...DEFAULT_PROFILE,
    ...(isPlainObject(profile) ? profile : {}),
    version: PROFILE_VERSION
  };
  if (!Array.isArray(nextProfile.unlockedTowerTypes)) {
    nextProfile.unlockedTowerTypes = [...DEFAULT_PROFILE.unlockedTowerTypes];
  }
  if (!Array.isArray(nextProfile.achievements)) {
    nextProfile.achievements = [];
  }
  if (!Array.isArray(nextProfile.completedMissions)) {
    nextProfile.completedMissions = [];
  }
  if (!isPlainObject(nextProfile.researchUpgrades)) {
    nextProfile.researchUpgrades = {};
  }
  if (!isPlainObject(nextProfile.balanceMetrics)) {
    nextProfile.balanceMetrics = { ...DEFAULT_PROFILE.balanceMetrics };
  }
  return nextProfile;
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getLowestResource(resources) {
  const entries = Object.entries(resources);
  if (entries.length === 0) {
    return null;
  }
  return entries.reduce((lowest, current) => (current[1] < lowest[1] ? current : lowest))[0];
}

function mergeCounts(left, right) {
  const merged = { ...left };
  Object.entries(right).forEach(([key, value]) => {
    merged[key] = Math.max(merged[key] || 0, value || 0);
  });
  return merged;
}
