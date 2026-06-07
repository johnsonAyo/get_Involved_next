
import type { Candidate, DirectoryStateOption, Fact, Party } from "@/types/domain";
import { createClient } from "@supabase/supabase-js";

function hasServerSupabaseConfig() {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SECRET_KEY;
}

function createSupabaseServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}
import { nigeriaGeo } from "@/data/nigeria.js";

type CandidateRow = {
  id: string;
  year: number | null;
  vice_candidate_name: string | null;
  party_id: string | null;
  position: string | null;
  position_sort_order: number | null;
  state_id: string | null;
  lga: string | null;
  display: boolean | null;
  source: unknown;
  profile: {
    id: string;
    birth_year: number | null;
    career_history: unknown;
    education: unknown;
    full_name: string | null;
    links: unknown;
    profile_highlights: unknown;
    profile_url: string | null;
    profile_picture_url: string | null;
    state_of_origin: string | null;
  } | null;
  party: {
    id: string;
    abbreviation: string;
    name: string;
    logo: string | null;
  } | null;
};

type PartyRow = {
  abbreviation: string;
  id: string;
  logo: string | null;
  name: string;
};

type ProfileRow = CandidateRow["profile"];

function normalizeSource(source: unknown): string[] {
  if (Array.isArray(source)) {
    return source.filter(
      (value): value is string => typeof value === "string" && value.trim().length > 0,
    );
  }

  if (typeof source === "string" && source.trim()) {
    return [source];
  }

  return [];
}

function normalizeTextList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0,
  );
}

function formatCandidateName(str?: string | null): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/(?:^|\s|-)\S/g, (match) => match.toUpperCase());
}

function mapSupabaseCandidate(row: CandidateRow): Candidate {
  let safePosition = row.position || "Unknown Position";
  if (safePosition === "Governor") safePosition = "Governorship";
  if (safePosition === "Senator (Senate)" || safePosition === "senate") safePosition = "Senate";

  return {
    id: row.id,
    year: row.year ?? undefined,
    birthYear: row.profile?.birth_year ?? undefined,
    candidateName: formatCandidateName(row.profile?.full_name),
    careerHistory: normalizeTextList(row.profile?.career_history),
    education: normalizeTextList(row.profile?.education),
    profileHighlights: normalizeTextList(row.profile?.profile_highlights),
    profileSources: normalizeTextList(row.profile?.links),
    viceCandidateName: formatCandidateName(row.vice_candidate_name),
    partyId: row.party_id?.toLowerCase() || "",
    party: row.party?.abbreviation || "Independent",
    partyFullName: row.party?.name || "Independent",
    position: safePosition,
    stateId: row.state_id?.toLowerCase() || "",
    stateName: row.profile?.state_of_origin || undefined,
    lga: row.lga || "",
    display: row.display !== false,
    source: normalizeSource(row.source),
    profileUrl: row.profile?.profile_url || "",
    profilePictureUrl: row.profile?.profile_picture_url || "",
    logo: row.party?.logo || "",
  };
}



async function getCandidatesFromSupabase(): Promise<Candidate[] | null> {
  if (!hasServerSupabaseConfig()) {
    return null;
  }

  try {
    const supabase = createSupabaseServerClient();
    if (!supabase) return null;

    const { data: candidates, error } = await supabase
      .from("candidates")
      .select('*')
      .eq("display", true)
      .order("year", { ascending: false, nullsFirst: false });

    if (error || !Array.isArray(candidates) || candidates.length === 0) {
      return null;
    }

    const profileSelect = "id, full_name, birth_year, education, career_history, profile_highlights, links, profile_url, profile_picture_url, state_of_origin";
    let profilesData: ProfileRow[] | null = null;
    const { data: detailedProfilesData, error: profilesError } = await supabase
      .from("profile")
      .select(profileSelect);
    profilesData = detailedProfilesData as ProfileRow[] | null;

    if (profilesError) {
      const fallback = await supabase
        .from("profile")
        .select("id, full_name, links, profile_url, profile_picture_url, state_of_origin");
      profilesData = fallback.data as ProfileRow[] | null;
    }
    const { data: partiesData } = await supabase.from("parties").select("id, abbreviation, name, logo");

    const profilesMap = new Map((profilesData || []).filter((p): p is NonNullable<ProfileRow> => Boolean(p)).map(p => [p.id, p]));
    const partiesMap = new Map((partiesData || []).map(p => [p.id, p]));

    const enrichedData = (candidates || []).map(candidate => ({
      ...candidate,
      profile: candidate.profile_id ? profilesMap.get(candidate.profile_id) || null : null,
      party: candidate.party_id ? partiesMap.get(candidate.party_id) || null : null
    }));

    const PREFERRED_PRESIDENTIAL_PARTY_IDS = ["ndc", "apc", "adc"];
    const NOT_FOUND_INDEX = -1;

    const mapped = enrichedData.map((row) => mapSupabaseCandidate(row as unknown as CandidateRow));

    const positionsList = getPositions().map(p => p.toLowerCase());
    const getPositionOrder = (pos: string) => {
      if (!pos) return Number.MAX_SAFE_INTEGER;
      const p = pos.toLowerCase();
      const index = positionsList.findIndex(x => p.includes(x) || x.includes(p));
      return index === -1 ? Number.MAX_SAFE_INTEGER : index;
    };

    return mapped.sort((a, b) => {
      // 1. Sort by computed position order first
      const orderA = getPositionOrder(a.position);
      const orderB = getPositionOrder(b.position);
      if (orderA !== orderB) return orderA - orderB;

      // 2. Sort preferred presidential parties first if both are president
      if (a.position?.toLowerCase().includes("president") || b.position?.toLowerCase().includes("president")) {
        const partyIndexA = PREFERRED_PRESIDENTIAL_PARTY_IDS.indexOf(a.partyId?.toLowerCase() || "");
        const partyIndexB = PREFERRED_PRESIDENTIAL_PARTY_IDS.indexOf(b.partyId?.toLowerCase() || "");

        if (partyIndexA !== NOT_FOUND_INDEX && partyIndexB === NOT_FOUND_INDEX) return -1;
        if (partyIndexA === NOT_FOUND_INDEX && partyIndexB !== NOT_FOUND_INDEX) return 1;
        if (partyIndexA !== NOT_FOUND_INDEX && partyIndexB !== NOT_FOUND_INDEX) return partyIndexA - partyIndexB;
      }

      // 3. Fallback to candidate name sorting
      const nameA = a.candidateName || "";
      const nameB = b.candidateName || "";
      return nameA.localeCompare(nameB);
    });
  } catch {
    return null;
  }
}



async function getPartiesFromSupabase(): Promise<Party[] | null> {
  if (!hasServerSupabaseConfig()) {
    return null;
  }

  try {
    const supabase = createSupabaseServerClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("parties")
      .select("id, name, abbreviation, logo")
      .order("name", { ascending: true });

    if (error || !Array.isArray(data) || data.length === 0) {
      return null;
    }

    return data.map((row) => ({
      abbreviation: (row as PartyRow).abbreviation,
      id: (row as PartyRow).id,
      logo: (row as PartyRow).logo || undefined,
      name: (row as PartyRow).name,
    }));
  } catch {
    return null;
  }
}

export async function getCandidates(): Promise<Candidate[]> {
  const supabaseCandidates = await getCandidatesFromSupabase();
  return supabaseCandidates || [];
}

export async function getParties(): Promise<Party[]> {
  const supabaseParties = await getPartiesFromSupabase();
  return supabaseParties || [];
}

export function getPositions(): string[] {
  return [
    "President",
    "Vice President",
    "Senator",
    "House of Representatives",
    "Governor",
    "Deputy Governor",
    "State House of Assembly",
    "Local Government Chairman",
    "Councillor"
  ];
}

export async function getFacts(): Promise<Fact[]> {
  if (!hasServerSupabaseConfig()) return [];
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("election_facts")
    .select("id, category, text, source")
    .eq("display", true)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data as Fact[];
}

export function getDirectoryStates(): DirectoryStateOption[] {
  return [...nigeriaGeo]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((state) => ({ id: state.id, name: state.name }));
}
