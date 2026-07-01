import { ENEMY_TYPES, TOWER_TYPES } from "./gameLogic.js";
import { MAPS } from "./maps.js";

export function getMapAnalysis(profile, mapId) {
  const stats = profile.perMapStats?.[mapId] || {};
  const losses = profile.balanceMetrics?.lossesByMap?.[mapId] || 0;
  const topLeak = topEntry(profile.balanceMetrics?.leakedByEnemy || {});
  const topTower = topEntry(profile.balanceMetrics?.towersUsed || {});

  return {
    map: MAPS[mapId],
    bestScore: stats.bestScore || 0,
    maxWave: stats.maxWave || 0,
    runs: stats.runs || 0,
    losses,
    topLeak: topLeak
      ? {
          id: topLeak[0],
          name: ENEMY_TYPES[topLeak[0]]?.name || topLeak[0],
          count: topLeak[1]
        }
      : null,
    topTower: topTower
      ? {
          id: topTower[0],
          name: TOWER_TYPES[topTower[0]]?.name || topTower[0],
          count: topTower[1]
        }
      : null
  };
}

export function getBalanceSuggestions(profile, state) {
  const suggestions = [];
  const metrics = profile.balanceMetrics || {};
  const mapLosses = metrics.lossesByMap?.[state.mapId] || 0;
  const topLeak = topEntry(metrics.leakedByEnemy || {});
  const towersUsed = metrics.towersUsed || {};
  const lowestResource = metrics.lowestResource;

  if (mapLosses >= 2) {
    suggestions.push(`Has perdido ${mapLosses} veces en este mapa. Prueba modo practica para ajustar economia.`);
  }
  if (topLeak) {
    const enemyName = ENEMY_TYPES[topLeak[0]]?.name || topLeak[0];
    suggestions.push(`${enemyName} es tu fuga mas frecuente. Cambia prioridad y agrega control de velocidad.`);
  }
  if (!towersUsed.freezer || towersUsed.freezer < 2) {
    suggestions.push("Usas poco Sandbox: puede estabilizar Spyware, DDoS y Exploit.");
  }
  if (!towersUsed.detector && state.maxWaveReached >= 3) {
    suggestions.push("Detector aumenta rango de torres cercanas; funciona bien en mapas largos.");
  }
  if (lowestResource === "net") {
    suggestions.push("La Red cae con frecuencia: prepara Sandbox o Servidor espejo contra Botnet/DDoS.");
  }
  if (lowestResource === "disk") {
    suggestions.push("El Disco esta sufriendo: prioriza Rootkit/Ransomware con Firewall o IA Centinela.");
  }

  return suggestions.slice(0, 4);
}

function topEntry(record) {
  const entries = Object.entries(record);
  if (entries.length === 0) {
    return null;
  }
  return entries.sort((a, b) => b[1] - a[1])[0];
}
