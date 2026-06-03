import { PARTIES } from "./parties.js";
import { POSITIONS } from "./positions.js";
import { fetchSanity } from "../lib/sanity";

export const localCandidatesData = [
  {
    id: 1,
    partyId: "ndc",
    candidateName: "Peter Obi",
    viceCandidateName: "Rabiu Kwankwaso",
    position: POSITIONS.PRESIDENTIAL_CANDIDATE,
    display: true,
    source: "https://en.wikipedia.org/wiki/2023_Nigerian_presidential_election"
  },
  {
    id: 2,
    partyId: "apc",
    candidateName: "Bola Ahmed Tinubu",
    position: POSITIONS.PRESIDENTIAL_CANDIDATE,
    display: true,
    source: "https://en.wikipedia.org/wiki/2023_Nigerian_presidential_election"
  },
  {
    id: 3,
    partyId: "adc",
    candidateName: "Atiku Abubakar",
    position: POSITIONS.PRESIDENTIAL_CANDIDATE,
    display: true,
    source: "https://en.wikipedia.org/wiki/2023_Nigerian_presidential_election"
  },
  {
    id: 4,
    partyId: "apm",
    candidateName: "Seyi Makinde",
    position: POSITIONS.PRESIDENTIAL_CANDIDATE,
    display: true,
    source: "https://en.wikipedia.org/wiki/2023_Nigerian_presidential_election"
  },
  {
    id: 5,
    partyId: "ypp",
    candidateName: "Anita Zugwai-Chukwu",
    position: POSITIONS.PRESIDENTIAL_CANDIDATE,
    display: true,
    source: ["https://punchng.com/ypp-unveils-female-presidential-flagbearer/#"]
  },
  {
    id: 9,
    partyId: "ndc",
    candidateName: "Morris Monye",
    position: POSITIONS.HOUSE_OF_ASSEMBLY_STATE,
    stateId: "delta",
    lga: "Aniocha South",
    display: true,
    source: "https://en.wikipedia.org/wiki/2023_Nigerian_presidential_election"
  },
  {
    id: 6,
    partyId: "ndc",
    candidateName: "Dumo Lulu-Briggs",
    position: POSITIONS.GOVERNOR,
    stateId: "rivers",
    display: true,
    source: ["https://dailypost.ng/2026/05/30/rivers-2027-dumo-lulu-briggs-wins-ndc-governorship-ticket-set-to-battle-wikes-ally-chinda/"]
  },
  {
    id: 7,
    partyId: "ndc",
    candidateName: "Adefolaseye Adebomi Adebayo",
    position: POSITIONS.HOUSE_OF_REPS,
    stateId: "lagos",
    lga: "surulere",
    display: true,
    source: ["https://x.com/DrFolaseye/status/2060505311954276542?s=20"]
  },
  {
    id: 8,
    partyId: "ndc",
    candidateName: "Aliyu Mohammed",
    position: POSITIONS.HOUSE_OF_REPS,
    stateId: "adamawa",
    lga: "Grie",
    display: true,
    source: ["https://x.com/SarkinMota_AMF/status/2060394424010494052?s=20"]
  },

  {
    id: 10,
    partyId: "ndc",
    candidateName: "Aminu Abdulsalam Gwarzo",
    position: POSITIONS.GOVERNOR,
    stateId: "kano",
    display: true,
    source: ["https://x.com/PO_GrassRootM/status/2060711066485526551?s=20"]
  },
  {
    id: 11,
    partyId: "ndc",
    candidateName: "Faith Ugbeshe",
    position: POSITIONS.HOUSE_OF_ASSEMBLY_STATE,
    stateId: "lagos",
    lga: "amunwo-odofin",
    display: true,
    source: ["https://x.com/faithdevs/status/2060484962319552626?s=20"]
  },
  {
    id: 12,
    partyId: "ndc",
    candidateName: "Ibrahim Kashim",
    position: POSITIONS.GOVERNOR,
    stateId: "bauchi",
    display: true,
    source: ["https://gazettengr.com/ndc-picks-kashim-as-bauchi-governorship-candidate-for-2027/"]
  },
  {
    id: 13,
    partyId: "ndc",
    candidateName: "Umanu Elijah",
    position: POSITIONS.HOUSE_OF_REPS,
    stateId: "Edo",
    lga: "Etsako Federal Constituency",
    display: true,
    source: ["https://x.com/mrUmanu_Elijah/status/2060815813263733207?s=20"]
  },
  {
    id: 14,
    partyId: "aac",
    candidateName: "Omoyele Sowore",
    position: POSITIONS.PRESIDENTIAL_CANDIDATE,
    display: true,
    source: ["https://www.premiumtimesng.com/news/top-news/882985-2027-sowore-emerges-aac-presidential-candidate.html"]
  },
];

function toSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isConformingId(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

const PREFERRED_PRESIDENTIAL_PARTY_IDS = ["ndc", "apc", "adc"];
const NOT_FOUND_INDEX = -1;

function sortCandidates(candidates) {
  const positionPriority = {
    [POSITIONS.PRESIDENTIAL_CANDIDATE]: 1,
    [POSITIONS.GOVERNOR]: 2,
    [POSITIONS.SENATOR]: 3,
    [POSITIONS.HOUSE_OF_REPS]: 4,
    [POSITIONS.HOUSE_OF_ASSEMBLY_STATE]: 5,
    [POSITIONS.LGA_CHAIRMAN]: 6,
  };

  return [...candidates].sort((a, b) => {
    const explicitOrderA =
      typeof a.positionSortOrder === "number" ? a.positionSortOrder : null;
    const explicitOrderB =
      typeof b.positionSortOrder === "number" ? b.positionSortOrder : null;
    if (explicitOrderA !== null || explicitOrderB !== null) {
      const aValue = explicitOrderA ?? Number.MAX_SAFE_INTEGER;
      const bValue = explicitOrderB ?? Number.MAX_SAFE_INTEGER;
      if (aValue !== bValue) return aValue - bValue;
    }

    const priorityA = positionPriority[a.position] || 99;
    const priorityB = positionPriority[b.position] || 99;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    if (a.position === POSITIONS.PRESIDENTIAL_CANDIDATE) {
      const partyIndexA = PREFERRED_PRESIDENTIAL_PARTY_IDS.indexOf(a.partyId?.toLowerCase());
      const partyIndexB = PREFERRED_PRESIDENTIAL_PARTY_IDS.indexOf(b.partyId?.toLowerCase());

      if (partyIndexA !== NOT_FOUND_INDEX && partyIndexB === NOT_FOUND_INDEX) return -1;
      if (partyIndexA === NOT_FOUND_INDEX && partyIndexB !== NOT_FOUND_INDEX) return 1;
      if (partyIndexA !== NOT_FOUND_INDEX && partyIndexB !== NOT_FOUND_INDEX) return partyIndexA - partyIndexB;
    }

    const nameA = a.candidateName || "";
    const nameB = b.candidateName || "";
    return nameA.localeCompare(nameB);
  });
}

function mapCandidate(candidate) {
  if (typeof candidate.party === "string" && candidate.party.trim()) {
    return candidate;
  }

  const party = PARTIES[candidate.partyId];
  return {
    ...candidate,
    party: party ? party.abbreviation : "",
    partyFullName: party ? party.name : "",
    logo: party ? party.logo : "",
  };
}

function formatCandidateName(str) {
  if (!str || typeof str !== "string") return "";
  return str
    .toLowerCase()
    .replace(/(?:^|\s|-)\S/g, (match) => match.toUpperCase());
}

function normalizeCandidate(candidate) {
  const rawId =
    candidate.id === undefined || candidate.id === null
      ? ""
      : String(candidate.id).trim();
  const safeId = isConformingId(rawId)
    ? rawId
    : toSlug(candidate.candidateName) || toSlug(rawId) || toSlug(candidate._id);

  const safeSource = Array.isArray(candidate.source)
    ? candidate.source.filter((src) => typeof src === "string" && src.trim())
    : typeof candidate.source === "string" && candidate.source.trim()
      ? [candidate.source]
      : [];

  let safePosition =
    typeof candidate.position === "string"
      ? candidate.position
      : candidate.position && typeof candidate.position.name === "string"
        ? candidate.position.name
        : "Unknown Position";

  if (safePosition === "Governor") {
    safePosition = "Governorship";
  }

  if (safePosition === "Senator (Senate)" || safePosition === "senate") {
    safePosition = "Senate";
  }

  return {
    ...candidate,
    id: safeId || rawId || "candidate",
    candidateName: formatCandidateName(candidate.candidateName),
    viceCandidateName: candidate.viceCandidateName ? formatCandidateName(candidate.viceCandidateName) : "",
    profileUrl:
      typeof candidate.profileUrl === "string" && candidate.profileUrl.trim()
        ? candidate.profileUrl.trim()
        : "",
    partyId:
      typeof candidate.partyId === "string" ? candidate.partyId.toLowerCase() : "",
    party:
      typeof candidate.party === "string" && candidate.party.trim()
        ? candidate.party
        : "Independent",
    partyFullName:
      typeof candidate.partyFullName === "string" && candidate.partyFullName.trim()
        ? candidate.partyFullName
        : "Independent",
    position: safePosition,
    stateId: typeof candidate.stateId === "string" ? candidate.stateId.toLowerCase() : "",
    lga: typeof candidate.lga === "string" ? candidate.lga : "",
    source: safeSource,
    logo: typeof candidate.logo === "string" ? candidate.logo : "",
  };
}

function mergeCandidates(localCandidates, sanityCandidates) {
  const merged = new Map();

  for (const candidate of localCandidates.map(normalizeCandidate)) {
    merged.set(candidate.id, candidate);
  }

  for (const candidate of sanityCandidates.map(normalizeCandidate)) {
    merged.set(candidate.id, {
      ...merged.get(candidate.id),
      ...candidate,
    });
  }

  return Array.from(merged.values());
}

export async function fetchCandidates() {
  const sanityCandidates = await fetchSanity("candidates");
  const candidates =
    Array.isArray(sanityCandidates) && sanityCandidates.length > 0
      ? mergeCandidates(localCandidatesData, sanityCandidates)
      : localCandidatesData.map(normalizeCandidate);

  return sortCandidates(candidates).map(mapCandidate);
}
