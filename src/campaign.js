export const CAMPAIGN_STEPS = [
  {
    id: "boot",
    title: "Arranque seguro",
    mapId: "classic",
    difficultyId: "easy",
    goalWave: 3,
    description: "Aprende a sostener el nucleo con una ruta equilibrada."
  },
  {
    id: "routing",
    title: "Ruteo defensivo",
    mapId: "longCircuit",
    difficultyId: "normal",
    goalWave: 4,
    description: "Usa el camino largo para mejorar torres sin perder foco."
  },
  {
    id: "containment",
    title: "Contencion angular",
    mapId: "forkedCache",
    difficultyId: "normal",
    goalWave: 5,
    description: "Combina ralentizacion y prioridades contra amenazas mixtas."
  },
  {
    id: "incident",
    title: "Incidente critico",
    mapId: "hardLine",
    difficultyId: "hard",
    goalWave: 5,
    description: "Supera una ruta corta con economia precisa."
  },
  {
    id: "expert",
    title: "Auditoria final",
    mapId: "expertBus",
    difficultyId: "hard",
    goalWave: 6,
    description: "Demuestra dominio con el mapa experto."
  }
];

export function getCampaignStatus(profile) {
  const completed = new Set(profile.completedCampaignSteps || []);
  let firstLockedFound = false;

  return CAMPAIGN_STEPS.map((step, index) => {
    const complete = completed.has(step.id);
    const unlocked = index === 0 || completed.has(CAMPAIGN_STEPS[index - 1].id);
    const current = unlocked && !complete && !firstLockedFound;
    if (current) {
      firstLockedFound = true;
    }
    return {
      ...step,
      complete,
      unlocked,
      current
    };
  });
}

export function evaluateCampaign(profile, state) {
  const completed = new Set(profile.completedCampaignSteps || []);
  const newlyCompleted = [];

  CAMPAIGN_STEPS.forEach((step, index) => {
    const previousComplete = index === 0 || completed.has(CAMPAIGN_STEPS[index - 1].id);
    const matchesRun = state.mapId === step.mapId && state.difficultyId === step.difficultyId;
    if (!completed.has(step.id) && previousComplete && matchesRun && state.maxWaveReached >= step.goalWave) {
      completed.add(step.id);
      newlyCompleted.push(step.id);
    }
  });

  return {
    completedCampaignSteps: Array.from(completed),
    newlyCompleted
  };
}
