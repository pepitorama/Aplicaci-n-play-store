export const DEFAULT_MAP_ID = "classic";

export const MAPS = {
  classic: {
    id: "classic",
    name: "Nucleo clasico",
    difficulty: "Equilibrado",
    description: "Ruta base con curvas claras para aprender el bucle.",
    modifiers: {
      reward: 1,
      enemySpeed: 1,
      waveSize: 1,
      startingBonus: 0
    },
    path: [
      { col: 0, row: 4 },
      { col: 1, row: 4 },
      { col: 2, row: 4 },
      { col: 3, row: 4 },
      { col: 3, row: 2 },
      { col: 5, row: 2 },
      { col: 5, row: 6 },
      { col: 8, row: 6 },
      { col: 8, row: 3 },
      { col: 11, row: 3 },
      { col: 11, row: 5 },
      { col: 13, row: 5 }
    ]
  },
  longCircuit: {
    id: "longCircuit",
    name: "Circuito largo",
    difficulty: "Planificacion",
    description: "Camino mas largo con muchas ventanas para upgrades.",
    modifiers: {
      reward: 0.96,
      enemySpeed: 0.94,
      waveSize: 1.05,
      startingBonus: 10
    },
    path: [
      { col: 0, row: 2 },
      { col: 2, row: 2 },
      { col: 2, row: 6 },
      { col: 4, row: 6 },
      { col: 4, row: 1 },
      { col: 7, row: 1 },
      { col: 7, row: 7 },
      { col: 10, row: 7 },
      { col: 10, row: 3 },
      { col: 12, row: 3 },
      { col: 12, row: 5 },
      { col: 13, row: 5 }
    ]
  },
  forkedCache: {
    id: "forkedCache",
    name: "Cache angular",
    difficulty: "Control",
    description: "Curvas compactas que premian Sandbox y prioridad de objetivo.",
    modifiers: {
      reward: 1.04,
      enemySpeed: 1,
      waveSize: 1.08,
      startingBonus: 0
    },
    path: [
      { col: 0, row: 6 },
      { col: 2, row: 6 },
      { col: 2, row: 3 },
      { col: 4, row: 3 },
      { col: 4, row: 5 },
      { col: 6, row: 5 },
      { col: 6, row: 2 },
      { col: 9, row: 2 },
      { col: 9, row: 6 },
      { col: 11, row: 6 },
      { col: 11, row: 4 },
      { col: 13, row: 4 }
    ]
  },
  hardLine: {
    id: "hardLine",
    name: "Linea dura",
    difficulty: "Dificil",
    description: "Ruta corta: cada decision economica importa.",
    modifiers: {
      reward: 1.14,
      enemySpeed: 1.08,
      waveSize: 0.94,
      startingBonus: -5
    },
    path: [
      { col: 0, row: 4 },
      { col: 2, row: 4 },
      { col: 2, row: 2 },
      { col: 6, row: 2 },
      { col: 6, row: 4 },
      { col: 9, row: 4 },
      { col: 9, row: 6 },
      { col: 13, row: 6 }
    ]
  },
  spiralCore: {
    id: "spiralCore",
    name: "Espiral del nucleo",
    difficulty: "Resistencia",
    description: "Ruta en espiral para defensas de area y rangos largos.",
    modifiers: {
      reward: 0.98,
      enemySpeed: 0.9,
      waveSize: 1.12,
      startingBonus: 15
    },
    path: [
      { col: 0, row: 1 },
      { col: 12, row: 1 },
      { col: 12, row: 7 },
      { col: 1, row: 7 },
      { col: 1, row: 3 },
      { col: 10, row: 3 },
      { col: 10, row: 5 },
      { col: 4, row: 5 },
      { col: 4, row: 4 },
      { col: 13, row: 4 }
    ]
  },
  quickPatch: {
    id: "quickPatch",
    name: "Parche rapido",
    difficulty: "Partida corta",
    description: "Ruta compacta para sesiones rapidas y decisiones agresivas.",
    modifiers: {
      reward: 1.2,
      enemySpeed: 1.14,
      waveSize: 0.82,
      startingBonus: 5
    },
    path: [
      { col: 0, row: 5 },
      { col: 4, row: 5 },
      { col: 4, row: 3 },
      { col: 8, row: 3 },
      { col: 8, row: 5 },
      { col: 13, row: 5 }
    ]
  },
  expertBus: {
    id: "expertBus",
    name: "Bus experto",
    difficulty: "Experto",
    description: "Poco margen de error y alto valor por amenaza derrotada.",
    modifiers: {
      reward: 1.28,
      enemySpeed: 1.16,
      waveSize: 1.05,
      startingBonus: -15
    },
    path: [
      { col: 0, row: 2 },
      { col: 5, row: 2 },
      { col: 5, row: 6 },
      { col: 7, row: 6 },
      { col: 7, row: 2 },
      { col: 10, row: 2 },
      { col: 10, row: 6 },
      { col: 13, row: 6 }
    ]
  }
};

export function getMapDefinition(mapId = DEFAULT_MAP_ID) {
  return MAPS[mapId] || MAPS[DEFAULT_MAP_ID];
}

export function getMapIds() {
  return Object.keys(MAPS);
}
