const STORAGE_KEY = "defiende-nucleo-pc-profile-v1";

export const DEFAULT_PROFILE = {
  bestScore: 0,
  maxWave: 0,
  totalRuns: 0,
  tutorialSeen: false,
  muted: false,
  difficultyId: "normal",
  unlockedTowerTypes: ["packet", "firewall", "freezer"]
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
  const nextProfile = {
    ...profile,
    bestScore: Math.max(profile.bestScore || 0, state.score || 0),
    maxWave: Math.max(profile.maxWave || 0, state.maxWaveReached || state.wave || 0),
    difficultyId: state.difficultyId || profile.difficultyId,
    unlockedTowerTypes: unlocked
  };
  saveProfile(nextProfile);
  return nextProfile;
}

export function recordNewRun(profile, difficultyId) {
  const nextProfile = {
    ...profile,
    totalRuns: (profile.totalRuns || 0) + 1,
    difficultyId
  };
  saveProfile(nextProfile);
  return nextProfile;
}

export function setMuted(profile, muted) {
  const nextProfile = { ...profile, muted };
  saveProfile(nextProfile);
  return nextProfile;
}

function isStorageAvailable() {
  return typeof localStorage !== "undefined";
}
