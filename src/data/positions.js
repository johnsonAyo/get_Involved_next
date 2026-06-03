import { fetchSanity } from "../lib/sanity";

export const POSITIONS = {
  PRESIDENTIAL_CANDIDATE: "Presidential Candidate",
  GOVERNOR: "Governorship",
  SENATOR: "Senate",
  HOUSE_OF_REPS: "House of Representatives",
  HOUSE_OF_ASSEMBLY_STATE: "State House of Assembly",
  LGA_CHAIRMAN: "Local Government Chairman",
};

export async function fetchPositions() {
  const sanityPositions = await fetchSanity("positions");
  if (Array.isArray(sanityPositions) && sanityPositions.length > 0) {
    return sanityPositions
      .map((position) => position.name)
      .filter(Boolean);
  }

  return Object.values(POSITIONS);
}
