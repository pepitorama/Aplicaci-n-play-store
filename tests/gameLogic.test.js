import test from "node:test";
import assert from "node:assert/strict";

import {
  ENEMY_TYPES,
  TOWER_TYPES,
  canPlaceTower,
  createGameState,
  placeTower,
  previewWave,
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
