import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  DIFFICULTY_PRESETS,
  ENEMY_TYPES,
  SYSTEM_EVENTS,
  TARGET_MODES,
  TOWER_TYPES,
  applyReward,
  canPlaceTower,
  cellToPoint,
  createGameState,
  cycleTowerTargetMode,
  getTowerSellValue,
  getWaveProgress,
  isTowerUnlocked,
  placeTower,
  previewWave,
  sellTower,
  setDifficulty,
  setMap,
  startNextWave,
  updateGame,
  upgradeTower
} from "../src/gameLogic.js";
import {
  awardResearch,
  buyResearchUpgrade,
  exportProfile,
  importProfile,
  recordNewRun,
  resetProfile,
  setPracticeMode,
  setHighContrast,
  setLargeText,
  setReducedMotion,
  updateBalanceMetrics,
  updateProfileFromState
} from "../src/storage.js";
import { evaluateAchievements, evaluateMissions, getResearchUpgradeCost, RESEARCH_UPGRADES } from "../src/progression.js";
import { evaluateCampaign, getCampaignStatus } from "../src/campaign.js";
import { getMapDefinition } from "../src/maps.js";
import { getDailyChallenge, describeDailyChallenge } from "../src/dailyChallenge.js";
import { getBalanceSuggestions, getMapAnalysis } from "../src/analysis.js";
import { getBalanceCurve } from "../src/config/balance.js";
import { MAPS, getMapIds } from "../src/maps.js";

test("places a tower only on valid build cells and charges energy", () => {
  const state = createGameState();
  const startingMoney = state.money;

  assert.equal(placeTower(state, 0, 4, "packet"), false, "path cells are blocked");
  assert.equal(placeTower(state, 1, 1, "packet"), true);
  assert.equal(state.towers.length, 1);
  assert.equal(state.money, startingMoney - TOWER_TYPES.packet.cost);
  assert.equal(canPlaceTower(state, 1, 1, "packet"), false, "occupied cells are blocked");
});

test("wave preview summarizes enemy composition", () => {
  const firstWave = previewWave(1);
  const thirdWave = previewWave(3);

  assert.ok(firstWave.worm > 0);
  assert.ok(thirdWave.spyware > 0, "later waves include fast enemies");
  assert.ok(thirdWave.botnet > 0, "later waves include armored enemies");
});

test("upgrades spend energy and increase tower level", () => {
  const state = createGameState();
  assert.equal(placeTower(state, 2, 1, "firewall"), true);
  state.money = 500;
  const tower = state.towers[0];

  assert.equal(upgradeTower(state, tower.id), true);
  assert.equal(tower.level, 2);
  assert.ok(state.money < 500);
});

test("towers defeat spawned enemies and award score", () => {
  const state = createGameState();
  state.money = 500;
  placeTower(state, 1, 3, "packet");
  placeTower(state, 4, 3, "firewall");
  placeTower(state, 6, 5, "freezer");
  startNextWave(state);

  for (let step = 0; step < 900 && (state.activeWave || state.enemies.length > 0); step += 1) {
    updateGame(state, 1 / 30);
  }

  assert.equal(state.activeWave, false);
  assert.equal(state.enemies.length, 0);
  assert.ok(state.score > 0);
  assert.ok(state.money > 0);
});

test("enemies that reach the core reduce lives", () => {
  const state = createGameState();
  startNextWave(state);
  const initialLives = state.lives;

  for (let step = 0; step < 1800 && state.lives === initialLives; step += 1) {
    updateGame(state, 1 / 30);
  }

  assert.ok(state.lives < initialLives);
  assert.ok(Object.keys(ENEMY_TYPES).length >= 3);
});

test("difficulty presets adjust starting resources before a run starts", () => {
  const state = createGameState();

  assert.equal(setDifficulty(state, "hard"), true);
  assert.equal(state.difficultyId, DIFFICULTY_PRESETS.hard.id);
  assert.equal(state.money, DIFFICULTY_PRESETS.hard.startingMoney);
  assert.equal(state.lives, DIFFICULTY_PRESETS.hard.startingLives);

  startNextWave(state);
  assert.equal(setDifficulty(state, "easy"), false, "difficulty is locked once a run starts");
});

test("wave progress increases as enemies are resolved", () => {
  const state = createGameState();
  startNextWave(state);
  assert.equal(getWaveProgress(state), 0);

  for (let step = 0; step < 1200 && getWaveProgress(state) === 0; step += 1) {
    updateGame(state, 1 / 30);
  }

  assert.ok(getWaveProgress(state) > 0);
});

test("locked towers can be unlocked with blueprint rewards", () => {
  const state = createGameState();

  assert.equal(isTowerUnlocked(state, "tesla"), false);
  assert.equal(placeTower(state, 1, 1, "tesla"), false);
  assert.equal(applyReward(state, "blueprint"), true);
  assert.equal(isTowerUnlocked(state, "tesla"), true);
  state.money = 500;
  assert.equal(placeTower(state, 1, 1, "tesla"), true);
});

test("tower target mode can cycle and prioritize strong enemies", () => {
  const state = createGameState();
  state.money = 500;
  assert.equal(placeTower(state, 1, 3, "packet"), true);
  const tower = state.towers[0];

  assert.equal(tower.targetMode, "first");
  assert.equal(cycleTowerTargetMode(state, tower.id), true);
  assert.equal(tower.targetMode, "strong");
  assert.equal(TARGET_MODES[tower.targetMode].name, "Fuerte");

  state.enemies = [
    {
      id: 1,
      typeId: "worm",
      hp: 20,
      maxHp: 20,
      speed: 80,
      reward: 1,
      progress: 60,
      slowTimer: 0,
      slowFactor: 1,
      leaked: false,
      ...cellToPoint(1, 4)
    },
    {
      id: 2,
      typeId: "botnet",
      hp: 90,
      maxHp: 90,
      speed: 20,
      reward: 1,
      progress: 90,
      slowTimer: 0,
      slowFactor: 1,
      leaked: false,
      ...cellToPoint(2, 4)
    }
  ];

  updateGame(state, 0);
  assert.equal(tower.targetId, 2);
});

test("map can be changed before a run and blocks path placement on the selected map", () => {
  const state = createGameState();

  assert.equal(setMap(state, "hardLine"), true);
  assert.equal(state.mapId, "hardLine");
  assert.equal(placeTower(state, 2, 4, "packet"), false, "selected map path cells are blocked");
  assert.equal(placeTower(state, 1, 1, "packet"), true);
  assert.equal(setMap(state, "classic"), false, "map is locked after building");
});

test("selling a tower refunds part of invested energy", () => {
  const state = createGameState();
  state.money = 500;
  assert.equal(placeTower(state, 1, 1, "firewall"), true);
  const tower = state.towers[0];
  const refund = getTowerSellValue(tower);

  assert.equal(sellTower(state, tower.id), true);
  assert.equal(state.towers.length, 0);
  assert.ok(state.money >= 500 - TOWER_TYPES.firewall.cost + refund);
});

test("missions, achievements and profile import/export are evaluated safely", () => {
  const state = createGameState();
  state.money = 500;
  placeTower(state, 1, 1, "packet");
  state.maxWaveReached = 5;
  state.perfectWaves = 2;
  state.totalKills = 100;
  state.killsByType.spyware = 20;
  state.unlockedTowerTypes.push("tesla");

  const profile = {
    achievements: [],
    completedMissions: [],
    unlockedTowerTypes: ["packet", "firewall", "freezer"],
    mapsPlayed: ["classic", "hardLine"]
  };
  const achievements = evaluateAchievements(profile, state);
  const missions = evaluateMissions(profile, state);
  const serialized = exportProfile({ ...profile, achievements: achievements.achievements });
  const imported = importProfile(serialized);

  assert.ok(achievements.achievements.includes("firstDefense"));
  assert.ok(achievements.achievements.includes("sentinelUnlocked"));
  assert.ok(missions.completedMissions.includes("surviveFive"));
  assert.ok(missions.completedMissions.includes("spywareSweep"));
  assert.ok(imported.achievements.includes("firstDefense"));
});

test("new maps expose gameplay modifiers and affect wave preview size", () => {
  const classic = previewWave(4, 0, "normal", "classic");
  const spiral = previewWave(4, 0, "normal", "spiralCore");
  const expert = getMapDefinition("expertBus");

  const classicCount = Object.values(classic).reduce((total, count) => total + count, 0);
  const spiralCount = Object.values(spiral).reduce((total, count) => total + count, 0);

  assert.ok(spiralCount >= classicCount);
  assert.equal(expert.modifiers.enemySpeed > 1, true);
});

test("advanced towers unlock by wave and can use area or aura properties", () => {
  const state = createGameState();
  state.wave = 6;
  state.unlockedTowerTypes = Object.keys(TOWER_TYPES);
  state.money = 500;

  assert.equal(isTowerUnlocked(state, "trap"), true);
  assert.equal(placeTower(state, 1, 1, "trap"), true);
  assert.equal(placeTower(state, 2, 1, "detector"), true);
  assert.equal(TOWER_TYPES.trap.splashRadius > 0, true);
  assert.equal(TOWER_TYPES.detector.rangeBoostAura > 0, true);
});

test("exploit enemies deal extra core damage when leaking", () => {
  const state = createGameState();
  const initialLives = state.lives;
  state.enemies = [
    {
      id: 1,
      typeId: "exploit",
      hp: ENEMY_TYPES.exploit.hp,
      maxHp: ENEMY_TYPES.exploit.hp,
      speed: 9999,
      reward: 0,
      progress: 0,
      slowTimer: 0,
      slowFactor: 1,
      leaked: false,
      ...cellToPoint(0, 4)
    }
  ];
  state.activeWave = true;
  state.waveTotal = 1;

  updateGame(state, 1);
  assert.equal(state.lives, initialLives - ENEMY_TYPES.exploit.leakDamage);
});

test("profile stores high contrast preference", () => {
  const profile = setHighContrast({ highContrast: false }, true);

  assert.equal(profile.highContrast, true);
});

test("pc resources are reduced by enemy-specific leaks", () => {
  const state = createGameState();
  const initialCpu = state.resources.cpu;
  state.enemies = [
    {
      id: 1,
      typeId: "rootkit",
      hp: ENEMY_TYPES.rootkit.hp,
      maxHp: ENEMY_TYPES.rootkit.hp,
      speed: 9999,
      reward: 0,
      progress: 0,
      slowTimer: 0,
      slowFactor: 1,
      leaked: false,
      ...cellToPoint(0, 4)
    }
  ];
  state.activeWave = true;
  state.waveTotal = 1;

  updateGame(state, 1);
  assert.ok(state.resources.cpu < initialCpu);
});

test("research upgrades affect starting state and can be purchased", () => {
  const baseProfile = { researchPoints: 10, researchUpgrades: {} };
  const cost = getResearchUpgradeCost("energyCache", 0);
  const upgradedProfile = buyResearchUpgrade(baseProfile, "energyCache", cost, RESEARCH_UPGRADES.energyCache.maxLevel);
  const state = createGameState({ upgrades: upgradedProfile.researchUpgrades });

  assert.equal(upgradedProfile.researchUpgrades.energyCache, 1);
  assert.ok(state.money > createGameState().money);
});

test("campaign steps unlock after reaching their objective", () => {
  const profile = { completedCampaignSteps: [] };
  const state = createGameState({ difficultyId: "easy", mapId: "classic" });
  state.maxWaveReached = 3;
  const result = evaluateCampaign(profile, state);
  const status = getCampaignStatus({ completedCampaignSteps: result.completedCampaignSteps });

  assert.ok(result.completedCampaignSteps.includes("boot"));
  assert.equal(status[1].unlocked, true);
});

test("profile records difficulty, map runs and accessibility preferences", () => {
  let profile = { perMapStats: {}, recordsByDifficulty: {}, totalRuns: 0 };
  profile = recordNewRun(profile, "hard", "expertBus");
  const state = createGameState({ difficultyId: "hard", mapId: "expertBus" });
  state.score = 3200;
  state.maxWaveReached = 6;
  profile = updateProfileFromState(profile, state);
  profile = awardResearch(profile, state);
  profile = setReducedMotion(profile, true);
  profile = setLargeText(profile, true);

  assert.equal(profile.perMapStats.expertBus.runs, 1);
  assert.equal(profile.recordsByDifficulty.hard.bestScore, 3200);
  assert.ok(profile.researchPoints > 0);
  assert.equal(profile.reducedMotion, true);
  assert.equal(profile.largeText, true);
});

test("system events activate on scheduled waves", () => {
  const state = createGameState();
  state.wave = 2;

  startNextWave(state);
  assert.equal(state.systemEvent.id, SYSTEM_EVENTS.trafficSpike.id);
});

test("invalid profile imports are rejected", () => {
  assert.throws(() => importProfile("[]"));
  assert.throws(() => importProfile("{bad json"));
  assert.throws(() => importProfile(JSON.stringify({ note: "x".repeat(21000) })));
  const sanitized = importProfile(JSON.stringify({ bestScore: "bad", unexpectedField: true }));
  assert.equal(sanitized.bestScore, 0);
  assert.equal(sanitized.unexpectedField, undefined);
});

test("research purchase is blocked without enough points", () => {
  const profile = { researchPoints: 0, researchUpgrades: {} };
  const nextProfile = buyResearchUpgrade(profile, "globalDamage", 99, RESEARCH_UPGRADES.globalDamage.maxLevel);

  assert.equal(nextProfile, profile);
});

test("practice mode and reset profile keep safe defaults", () => {
  const profile = setPracticeMode({ practiceMode: false }, true);
  const reset = resetProfile();

  assert.equal(profile.practiceMode, true);
  assert.equal(reset.bestScore, 0);
  assert.deepEqual(reset.unlockedTowerTypes, ["packet", "firewall", "freezer"]);
});

test("balance metrics record losses, leaks and tower usage", () => {
  const state = createGameState({ mapId: "hardLine" });
  state.lives = 0;
  state.leakedByType.exploit = 2;
  state.towersPlacedByType.firewall = 3;
  state.resources.cpu = 12;
  const profile = updateBalanceMetrics({ balanceMetrics: {} }, state);

  assert.equal(profile.balanceMetrics.totalLosses, 1);
  assert.equal(profile.balanceMetrics.lossesByMap.hardLine, 1);
  assert.equal(profile.balanceMetrics.leakedByEnemy.exploit, 2);
  assert.equal(profile.balanceMetrics.towersUsed.firewall, 3);
  assert.equal(profile.balanceMetrics.lowestResource, "cpu");
});

test("daily challenge is deterministic and can modify preview size", () => {
  const date = new Date("2026-07-01T00:00:00.000Z");
  const challenge = getDailyChallenge(date);
  const sameChallenge = getDailyChallenge(date);
  const base = previewWave(5, 0, challenge.difficultyId, challenge.mapId);
  const modified = previewWave(5, 0, challenge.difficultyId, challenge.mapId, challenge.modifier.waveSize);
  const baseCount = Object.values(base).reduce((total, count) => total + count, 0);
  const modifiedCount = Object.values(modified).reduce((total, count) => total + count, 0);

  assert.equal(challenge.id, sameChallenge.id);
  assert.ok(describeDailyChallenge(challenge).includes("objetivo"));
  assert.notEqual(modifiedCount, 0);
  assert.ok(Math.abs(modifiedCount - baseCount) <= Math.max(4, baseCount));
});

test("analysis module summarizes map records and suggestions", () => {
  const profile = {
    perMapStats: { classic: { bestScore: 1000, maxWave: 4, runs: 2 } },
    balanceMetrics: {
      lossesByMap: { classic: 2 },
      leakedByEnemy: { exploit: 3 },
      towersUsed: { packet: 5 },
      lowestResource: "net"
    }
  };
  const state = createGameState({ mapId: "classic" });
  const analysis = getMapAnalysis(profile, "classic");
  const suggestions = getBalanceSuggestions(profile, state);

  assert.equal(analysis.bestScore, 1000);
  assert.equal(analysis.topLeak.name, ENEMY_TYPES.exploit.name);
  assert.ok(suggestions.length > 0);
});

test("balance curves expose map-specific pacing", () => {
  const classic = getBalanceCurve("classic");
  const hardLine = getBalanceCurve("hardLine");

  assert.notEqual(classic.enemyHealthPerWave, hardLine.enemyHealthPerWave);
});

test("configuration snapshot keeps unique ids and valid map routes", () => {
  const towerIds = Object.keys(TOWER_TYPES);
  const enemyIds = Object.keys(ENEMY_TYPES);
  const mapIds = getMapIds();

  assert.equal(new Set(towerIds).size, towerIds.length);
  assert.equal(new Set(enemyIds).size, enemyIds.length);
  assert.equal(new Set(mapIds).size, mapIds.length);
  assert.ok(towerIds.length >= 8);
  assert.ok(enemyIds.length >= 8);
  assert.ok(mapIds.length >= 7);

  Object.values(TOWER_TYPES).forEach((tower) => {
    assert.ok(tower.cost > 0);
    assert.ok(tower.unlockWave >= 0);
  });

  Object.values(MAPS).forEach((map) => {
    assert.ok(map.path.length >= 2);
    map.path.forEach((point) => {
      assert.ok(point.col >= 0 && point.col < 14);
      assert.ok(point.row >= 0 && point.row < 9);
    });
  });
});

test("service worker cache includes critical app shell assets", () => {
  const serviceWorker = readFileSync(new URL("../service-worker.js", import.meta.url), "utf8");

  [
    "./index.html",
    "./offline.html",
    "./help.html",
    "./privacy.html",
    "./src/appMeta.js",
    "./src/main.js",
    "./src/analysis.js",
    "./src/dailyChallenge.js",
    "./src/config/difficulty.js",
    "./src/config/balance.js"
  ].forEach((asset) => {
    assert.ok(serviceWorker.includes(asset), `${asset} should be cached`);
  });
});
