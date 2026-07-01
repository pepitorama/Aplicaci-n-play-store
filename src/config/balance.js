export const BALANCE_CURVES = {
  classic: {
    enemyHealthPerWave: 0.16,
    enemySpeedCap: 0.22,
    enemySpeedPerWave: 0.018
  },
  longCircuit: {
    enemyHealthPerWave: 0.15,
    enemySpeedCap: 0.2,
    enemySpeedPerWave: 0.016
  },
  forkedCache: {
    enemyHealthPerWave: 0.17,
    enemySpeedCap: 0.22,
    enemySpeedPerWave: 0.018
  },
  hardLine: {
    enemyHealthPerWave: 0.18,
    enemySpeedCap: 0.25,
    enemySpeedPerWave: 0.02
  },
  spiralCore: {
    enemyHealthPerWave: 0.15,
    enemySpeedCap: 0.2,
    enemySpeedPerWave: 0.015
  },
  quickPatch: {
    enemyHealthPerWave: 0.14,
    enemySpeedCap: 0.28,
    enemySpeedPerWave: 0.022
  },
  expertBus: {
    enemyHealthPerWave: 0.19,
    enemySpeedCap: 0.27,
    enemySpeedPerWave: 0.021
  }
};

export function getBalanceCurve(mapId) {
  return BALANCE_CURVES[mapId] || BALANCE_CURVES.classic;
}
