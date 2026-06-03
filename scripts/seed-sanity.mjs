import { createClient } from "@sanity/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const POSITIONS = {
  PRESIDENTIAL_CANDIDATE: "Presidential Candidate",
  GOVERNOR: "Governorship",
  SENATOR: "Senate",
  HOUSE_OF_REPS: "House of Representatives",
  HOUSE_OF_ASSEMBLY_STATE: "State House of Assembly",
  LGA_CHAIRMAN: "Local Government Chairman",
};

const PARTIES = {
  apc: {
    id: "apc",
    name: "All Progressives Congress",
    abbreviation: "APC",
    logo: "/assets/logo/APC-logo.png",
  },
  adc: {
    id: "adc",
    name: "African Democratic Congress",
    abbreviation: "ADC",
    logo: "/assets/logo/African_Democratic_Congress_logo.png",
  },
  ndc: {
    id: "ndc",
    name: "Nigeria Democratic Congress",
    abbreviation: "NDC",
    logo: "/assets/logo/ndc.png",
  },
  apm: {
    id: "apm",
    name: "Allied Peoples' Movement",
    abbreviation: "APM",
    logo: "/assets/logo/apm.png",
  },
  ypp: {
    id: "ypp",
    name: "Young Progressive Party",
    abbreviation: "YPP",
    logo: "/assets/logo/ypp.png",
  },
  aac: {
    id: "aac",
    name: "African Action Congress",
    abbreviation: "AAC",
    logo: "/assets/logo/aac.png",
  },
};

const localCandidatesData = [
  {
    id: 1,
    partyId: "ndc",
    candidateName: "Peter Obi",
    viceCandidateName: "Rabiu Kwankwaso",
    position: POSITIONS.PRESIDENTIAL_CANDIDATE,
    display: true,
    source: "https://en.wikipedia.org/wiki/2023_Nigerian_presidential_election",
  },
  {
    id: 2,
    partyId: "apc",
    candidateName: "Bola Ahmed Tinubu",
    position: POSITIONS.PRESIDENTIAL_CANDIDATE,
    display: true,
    source: "https://en.wikipedia.org/wiki/2023_Nigerian_presidential_election",
  },
  {
    id: 3,
    partyId: "adc",
    candidateName: "Atiku Abubakar",
    position: POSITIONS.PRESIDENTIAL_CANDIDATE,
    display: true,
    source: "https://en.wikipedia.org/wiki/2023_Nigerian_presidential_election",
  },
  {
    id: 4,
    partyId: "apm",
    candidateName: "Seyi Makinde",
    position: POSITIONS.PRESIDENTIAL_CANDIDATE,
    display: true,
    source: "https://en.wikipedia.org/wiki/2023_Nigerian_presidential_election",
  },
  {
    id: 5,
    partyId: "ypp",
    candidateName: "Anita Zugwai-Chukwu",
    position: POSITIONS.PRESIDENTIAL_CANDIDATE,
    display: true,
    source: ["https://punchng.com/ypp-unveils-female-presidential-flagbearer/#"],
  },
  {
    id: 9,
    partyId: "ndc",
    candidateName: "Morris Monye",
    position: POSITIONS.HOUSE_OF_ASSEMBLY_STATE,
    stateId: "delta",
    lga: "Aniocha South",
    display: true,
    source: "https://en.wikipedia.org/wiki/2023_Nigerian_presidential_election",
  },
  {
    id: 6,
    partyId: "ndc",
    candidateName: "Dumo Lulu-Briggs",
    position: POSITIONS.GOVERNOR,
    stateId: "rivers",
    display: true,
    source: [
      "https://dailypost.ng/2026/05/30/rivers-2027-dumo-lulu-briggs-wins-ndc-governorship-ticket-set-to-battle-wikes-ally-chinda/",
    ],
  },
  {
    id: 7,
    partyId: "ndc",
    candidateName: "Adefolaseye Adebomi Adebayo",
    position: POSITIONS.HOUSE_OF_REPS,
    stateId: "lagos",
    lga: "surulere",
    display: true,
    source: ["https://x.com/DrFolaseye/status/2060505311954276542?s=20"],
  },
  {
    id: 8,
    partyId: "ndc",
    candidateName: "Aliyu Mohammed",
    position: POSITIONS.HOUSE_OF_REPS,
    stateId: "adamawa",
    lga: "Grie",
    display: true,
    source: ["https://x.com/SarkinMota_AMF/status/2060394424010494052?s=20"],
  },
  {
    id: 10,
    partyId: "ndc",
    candidateName: "Aminu Abdulsalam Gwarzo",
    position: POSITIONS.GOVERNOR,
    stateId: "kano",
    display: true,
    source: ["https://x.com/PO_GrassRootM/status/2060711066485526551?s=20"],
  },
  {
    id: 11,
    partyId: "ndc",
    candidateName: "Faith Ugbeshe",
    position: POSITIONS.HOUSE_OF_ASSEMBLY_STATE,
    stateId: "lagos",
    lga: "amunwo-odofin",
    display: true,
    source: ["https://x.com/faithdevs/status/2060484962319552626?s=20"],
  },
  {
    id: 12,
    partyId: "ndc",
    candidateName: "Ibrahim Kashim",
    position: POSITIONS.GOVERNOR,
    stateId: "bauchi",
    display: true,
    source: ["https://gazettengr.com/ndc-picks-kashim-as-bauchi-governorship-candidate-for-2027/"],
  },
  {
    id: 13,
    partyId: "ndc",
    candidateName: "Umanu Elijah",
    position: POSITIONS.HOUSE_OF_REPS,
    stateId: "Edo",
    lga: "Etsako Federal Constituency",
    display: true,
    source: ["https://x.com/mrUmanu_Elijah/status/2060815813263733207?s=20"],
  },
  {
    id: 14,
    partyId: "aac",
    candidateName: "Omoyele Sowore",
    position: POSITIONS.PRESIDENTIAL_CANDIDATE,
    display: true,
    source: ["https://www.premiumtimesng.com/news/top-news/882985-2027-sowore-emerges-aac-presidential-candidate.html"],
  },
];

function loadDotEnv() {
  const envPath = resolve(process.cwd(), ".env");
  let raw = "";

  try {
    raw = readFileSync(envPath, "utf8");
  } catch {
    return;
  }

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex <= 0) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();
    if (!key || process.env[key]) continue;

    process.env[key] = value;
  }
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function maskToken(token) {
  if (!token) return "";
  if (token.length <= 10) return "***";
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

function toSlug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 96);
}

function partyDocId(partyId) {
  return `party.${toSlug(partyId)}`;
}

function positionDocId(positionName) {
  return `position.${toSlug(positionName)}`;
}

function candidateDocId(candidateId, candidateName) {
  const stable = toSlug(candidateId || candidateName);
  return `candidate.${stable || toSlug(candidateName)}`;
}

async function seed() {
  loadDotEnv();

  const projectId =
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() ||
    requiredEnv("VITE_SANITY_PROJECT_ID");
  const dataset =
    process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() ||
    requiredEnv("VITE_SANITY_DATASET");
  const token = requiredEnv("SANITY_API_WRITE_TOKEN");
  const apiVersion =
    process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() ||
    process.env.VITE_SANITY_API_VERSION?.trim() ||
    "2026-05-31";

  console.log("Sanity seed preflight:");
  console.log(`- projectId: ${projectId}`);
  console.log(`- dataset: ${dataset}`);
  console.log(`- apiVersion: ${apiVersion}`);
  console.log(`- writeToken: ${maskToken(token)}`);

  const client = createClient({
    projectId,
    dataset,
    token,
    apiVersion,
    useCdn: false,
  });

  const parties = Object.values(PARTIES);
  const positions = Object.values(POSITIONS);
  const candidates = localCandidatesData;

  const partyDocs = parties.map((party) => ({
    _id: partyDocId(party.id),
    _type: "party",
    name: party.name,
    abbreviation: party.abbreviation,
    slug: { _type: "slug", current: party.id },
    logoPath: party.logo || "",
  }));

  const positionDocs = positions.map((name, index) => ({
    _id: positionDocId(name),
    _type: "position",
    name,
    slug: { _type: "slug", current: toSlug(name) },
    sortOrder: index + 1,
  }));

  const candidateDocs = candidates.map((candidate) => {
    const sourceValues = Array.isArray(candidate.source)
      ? candidate.source
      : candidate.source
        ? [candidate.source]
        : [];

    return {
      _id: candidateDocId(candidate.id, candidate.candidateName),
      _type: "candidate",
      candidateName: candidate.candidateName,
      slug: { _type: "slug", current: toSlug(candidate.id || candidate.candidateName) },
      viceCandidateName: candidate.viceCandidateName || "",
      party: candidate.partyId
        ? { _type: "reference", _ref: partyDocId(candidate.partyId) }
        : undefined,
      position: candidate.position
        ? { _type: "reference", _ref: positionDocId(candidate.position) }
        : undefined,
      stateId: candidate.stateId || "",
      lga: candidate.lga || "",
      sources: sourceValues.filter(Boolean),
      display: true,
    };
  });

  try {
    const ping = await client.fetch("*[_type == 'party'][0]._id");
    console.log(`- connectivity: OK (sample read: ${ping ?? "none"})`);
  } catch (error) {
    const message = error?.message || String(error);
    const host = `${projectId}.api.sanity.io`;
    if (message.includes("ENOTFOUND")) {
      throw new Error(
        `Cannot resolve ${host}. Check internet/DNS or projectId. Original error: ${message}`,
      );
    }
    if (message.includes("401") || message.includes("Unauthorized")) {
      throw new Error(
        `Sanity authentication failed for ${host}. Check SANITY_API_WRITE_TOKEN permissions and project match. Original error: ${message}`,
      );
    }
    if (message.includes("403") || message.includes("Forbidden")) {
      throw new Error(
        `Sanity token is forbidden for dataset "${dataset}". Ensure token has write access. Original error: ${message}`,
      );
    }
    throw new Error(`Sanity connectivity preflight failed: ${message}`);
  }

  let tx = client.transaction();
  for (const doc of [...partyDocs, ...positionDocs, ...candidateDocs]) {
    tx = tx.createOrReplace(doc);
  }

  await tx.commit();

  console.log(
    `Seed complete: ${partyDocs.length} parties, ${positionDocs.length} positions, ${candidateDocs.length} candidates.`,
  );
}

seed().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
