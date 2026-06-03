import { nigeriaGeo } from "../data/nigeria.js";

export type NigeriaState = {
  id: string;
  name: string;
};

export const sortedStates: NigeriaState[] = [...nigeriaGeo].sort((a, b) =>
  a.name.localeCompare(b.name),
);

