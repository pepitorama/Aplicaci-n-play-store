export const DEFAULT_MAP_ID = "classic";

export const MAPS = {
  classic: {
    id: "classic",
    name: "Nucleo clasico",
    difficulty: "Equilibrado",
    description: "Ruta base con curvas claras para aprender el bucle.",
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
  }
};

export function getMapDefinition(mapId = DEFAULT_MAP_ID) {
  return MAPS[mapId] || MAPS[DEFAULT_MAP_ID];
}

export function getMapIds() {
  return Object.keys(MAPS);
}
