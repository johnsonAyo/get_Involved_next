export const queryKeys = {
  candidates: ["candidates"] as const,
  facts: ["facts"] as const,
  positions: ["positions"] as const,
  states: ["states"] as const,
  parties: ["parties"] as const,
  localGovernments: (stateId: string) => ["local-governments", stateId] as const,
};

