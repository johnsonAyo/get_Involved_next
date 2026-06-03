const invalidProjectIds = new Set([
  undefined,
  "",
  "missing-project-id",
  "your-project-id",
]);

export const sanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
export const sanityDataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production";
export const sanityApiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || "2026-05-31";

export const hasSanityConfig = !invalidProjectIds.has(sanityProjectId);
