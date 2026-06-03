import { nigeriaGeo, getLgas } from "./nigeria.js";

export async function fetchStates() {
  return [...nigeriaGeo]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((state) => ({ id: state.id, name: state.name }));
}

export async function fetchLocalGovernments(stateId) {
  if (!stateId) return [];
  return getLgas(stateId);
}
