import test from "node:test";
import assert from "node:assert/strict";

import {
  DIFFICULTY_PRESETS,
  ENEMY_TYPES,
  TOWER_TYPES,
  applyReward,
  canPlaceTower,
  createGameState,
  getWaveProgress,
  isTowerUnlocked,
  placeTower,
  previewWave,
  setDifficulty,
  startNextWave,
  updateGame,
  upgradeTower
} from "../src/gameLogic.js";

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
