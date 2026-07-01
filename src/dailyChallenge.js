import { getMapIds } from "./maps.js";

const DAILY_MODIFIERS = [
  {
    id: "overload",
    name: "Sobrecarga",
    description: "Oleadas mas numerosas; prioriza dano de area.",
    waveSize: 1.12,
    enemySpeed: 1,
    reward: 1.08
  },
  {
    id: "latency",
    name: "Latencia",
    description: "Amenazas mas lentas pero con menor recompensa.",
    waveSize: 1,
    enemySpeed: 0.94,
    reward: 0.95
  },
  {
    id: "bounty",
    name: "Caza recompensas",
    description: "Mas energia por amenaza derrotada.",
    waveSize: 1,
    enemySpeed: 1.04,
    reward: 1.16
  },
  {
    id: "breach",
    name: "Brecha activa",
    description: "Amenazas mas rapidas; usa Sandbox y Servidor espejo.",
    waveSize: 0.96,
    enemySpeed: 1.12,
    reward: 1.1
  }
];

const DIFFICULTIES = ["easy", "normal", "hard"];

export function getDailyChallenge(date = new Date()) {
  const seed = Number(date.toISOString().slice(0, 10).replaceAll("-", ""));
  const mapIds = getMapIds();
  const mapId = mapIds[seed % mapIds.length];
  const difficultyId = DIFFICULTIES[seed % DIFFICULTIES.length];
  const modifier = DAILY_MODIFIERS[seed % DAILY_MODIFIERS.length];
  return {
    id: `daily-${seed}`,
    date: date.toISOString().slice(0, 10),
    mapId,
    difficultyId,
    modifier,
    objective: 5 + (seed % 3)
  };
}

export function describeDailyChallenge(challenge) {
  return `Mapa ${challenge.mapId}, dificultad ${challenge.difficultyId}, objetivo oleada ${challenge.objective}: ${challenge.modifier.name}.`;
}
