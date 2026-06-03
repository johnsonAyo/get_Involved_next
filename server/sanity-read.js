import { createClient } from "@sanity/client";

const invalidProjectIds = new Set([
  undefined,
  "",
  "missing-project-id",
  "your-project-id",
]);

const operations = {
  candidates: `*[_type == "candidate" && display != false] {
    "_id": _id,
    "id": coalesce(slug.current, candidateName, _id),
    candidateName,
    profileUrl,
    viceCandidateName,
    "position": coalesce(position->name, position),
    "positionSortOrder": position->sortOrder,
    stateId,
    lga,
    display,
    "source": sources,
    "partyId": party->slug.current,
    "party": party->abbreviation,
    "partyFullName": party->name,
    "logo": coalesce(party->logo.asset->url, party->logoPath)
  }`,
  parties: `*[_type == "party"]{
    "id": coalesce(slug.current, _id),
    name,
    abbreviation,
    "logo": coalesce(logo.asset->url, logoPath)
  } | order(name asc)`,
  positions: `*[_type == "position"]{
    name,
    sortOrder
  } | order(sortOrder asc, name asc)`,
  debug: `{
    "candidateCount": count(*[_type == "candidate" && display != false]),
    "partyCount": count(*[_type == "party"]),
    "positionCount": count(*[_type == "position"]),
    "candidates": *[_type == "candidate" && display != false] | order(_createdAt desc) {
      _id,
      candidateName,
      profileUrl,
      "slug": slug.current,
      stateId,
      lga,
      display,
      "partyRef": party,
      "partyDocId": party->_id,
      "partySlug": party->slug.current,
      "partyName": party->name,
      "partyAbbreviation": party->abbreviation,
      "positionRef": position,
      "positionDocId": position->_id,
      "positionSlug": position->slug.current,
      "positionName": position->name,
      sources
    }
  }`,
};

function getSanityConfig() {
  const projectId =
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() ||
    process.env.SANITY_PROJECT_ID?.trim() ||
    process.env.VITE_SANITY_PROJECT_ID?.trim() ||
    "";
  const dataset =
    process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() ||
    process.env.SANITY_DATASET?.trim() ||
    process.env.VITE_SANITY_DATASET?.trim() ||
    "production";
  const apiVersion =
    process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() ||
    process.env.SANITY_API_VERSION?.trim() ||
    process.env.VITE_SANITY_API_VERSION?.trim() ||
    "2026-05-31";
  const token =
    process.env.SANITY_API_READ_TOKEN?.trim() ||
    process.env.SANITY_API_WRITE_TOKEN?.trim() ||
    "";

  if (invalidProjectIds.has(projectId) || !token) {
    return null;
  }

  return {
    apiVersion,
    dataset,
    projectId,
    token,
  };
}

export function hasServerSanityConfig() {
  return Boolean(getSanityConfig());
}

export async function fetchSanityOperation(operation, params = {}) {
  const config = getSanityConfig();
  if (!config) return null;

  const query = operations[operation];
  if (!query) {
    throw new Error(`Unsupported Sanity operation: ${operation}`);
  }

  const client = createClient({
    apiVersion: config.apiVersion,
    dataset: config.dataset,
    projectId: config.projectId,
    token: config.token,
    useCdn: false,
    perspective: "published",
  });

  return client.fetch(query, params);
}
