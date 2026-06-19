
import type { Candidate, DirectoryStateOption, Fact, Party, PollingUnit } from "@/types/domain";
import { createClient } from "@supabase/supabase-js";
import { nigeriaGeo } from "@/data/nigeria.js";

function hasServerSupabaseConfig() {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SECRET_KEY;
}

function createSupabaseServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

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

type PollingUnitRow = {
  id: string;
  polling_unit_code: string | null;
  polling_unit_name: string;
  remark: string | null;
  state_code: string | null;
  state: string;
  state_slug: string;
  lga: string;
  ward: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  coordinate_quality: string | null;
  coordinate_confidence: number | null;
  coordinate_source: string | null;
  coordinate_label: string | null;
  coordinate_match: string | null;
  source_snapshot_url: string | null;
  source_generated_at: string | null;
};

export type PollingUnitSearchFilters = {
  cursor?: string;
  direction?: "next" | "prev";
  lga?: string;
  query?: string;
  state?: string;
  ward?: string;
  page?: number;
};

export type PollingUnitSearchResult = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  items: PollingUnit[];
  nextCursor?: string;
  previousCursor?: string;
  total?: number;
  totalPages?: number;
  currentPage?: number;
};

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

function formatPollingUnitText(str?: string | null): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/(?:^|\s|-|\/)\S/g, (match) => match.toUpperCase());
}

function mapPollingUnit(row: PollingUnitRow): PollingUnit {
  return {
    id: row.id,
    pollingUnitCode: row.polling_unit_code || undefined,
    pollingUnitName: row.polling_unit_name,
    remark: row.remark || undefined,
    stateCode: row.state_code || undefined,
    state: formatPollingUnitText(row.state),
    stateSlug: row.state_slug,
    lga: formatPollingUnitText(row.lga),
    ward: formatPollingUnitText(row.ward),
    address: row.address || undefined,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    coordinateQuality: row.coordinate_quality || undefined,
    coordinateConfidence: row.coordinate_confidence ?? undefined,
    coordinateSource: row.coordinate_source || undefined,
    coordinateLabel: row.coordinate_label || undefined,
    coordinateMatch: row.coordinate_match || undefined,
    sourceSnapshotUrl: row.source_snapshot_url || undefined,
    sourceGeneratedAt: row.source_generated_at || undefined,
  };
}

function sanitizeSupabasePattern(value: string): string {
  return value.replace(/[%_,()]/g, " ").replace(/\s+/g, " ").trim();
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

export async function getPollingUnits({
  cursor = "",
  direction = "next",
  lga = "",
  query = "",
  state = "",
  ward = "",
  page = 1,
}: PollingUnitSearchFilters = {}): Promise<PollingUnitSearchResult> {
  const pageSize = 50;

  if (!hasServerSupabaseConfig()) {
    return {
      hasNextPage: false,
      hasPreviousPage: false,
      items: [],
    };
  }

  const trimmedQuery = sanitizeSupabasePattern(query);
  const trimmedState = state.trim().toLowerCase();
  const trimmedLga = lga.trim();
  const trimmedWard = ward.trim();
  const trimmedCursor = cursor.trim();
  const isPreviousPage = direction === "prev";
  const select =
    "id, polling_unit_code, polling_unit_name, remark, state_code, state, state_slug, lga, ward, address, latitude, longitude, coordinate_quality, coordinate_confidence, coordinate_source, coordinate_label, coordinate_match, source_snapshot_url, source_generated_at";

  const useOffset = Boolean(trimmedLga || trimmedWard);

  try {
    const supabase = createSupabaseServerClient();
    let pageRequest = supabase
      .from("polling_units")
      .select(select, useOffset ? { count: 'exact' } : undefined);

    if (useOffset) {
      pageRequest = pageRequest.order("id", { ascending: true });
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      pageRequest = pageRequest.range(from, to);
    } else {
      pageRequest = pageRequest
        .order("id", { ascending: !isPreviousPage })
        .limit(pageSize + 1);
    }

    if (trimmedState) {
      pageRequest = pageRequest.eq("state_slug", trimmedState);
    }

    if (trimmedLga) {
      pageRequest = pageRequest.ilike("lga", trimmedLga);
    }

    if (trimmedWard) {
      pageRequest = pageRequest.ilike("ward", trimmedWard);
    }

    if (trimmedQuery) {
      const pattern = `%${trimmedQuery}%`;
      const searchFilter = [
        `polling_unit_code.ilike.${pattern}`,
        `polling_unit_name.ilike.${pattern}`,
        `ward.ilike.${pattern}`,
        `lga.ilike.${pattern}`,
        `state.ilike.${pattern}`,
        `address.ilike.${pattern}`,
      ].join(",");
      pageRequest = pageRequest.or(searchFilter);
    }

    if (trimmedCursor && !useOffset) {
      pageRequest = isPreviousPage ? pageRequest.lt("id", trimmedCursor) : pageRequest.gt("id", trimmedCursor);
    }

    const { data, count, error: dataError } = await pageRequest;

    if (dataError || !Array.isArray(data)) {
      return {
        hasNextPage: false,
        hasPreviousPage: false,
        items: [],
      };
    }

    if (useOffset) {
      const items = data.map((row) => mapPollingUnit(row as PollingUnitRow));
      const totalPages = count ? Math.ceil(count / pageSize) : 1;
      return {
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        items,
        total: count || 0,
        totalPages,
        currentPage: page,
      };
    }

    const hasExtraRow = data.length > pageSize;
    const pageRows = data.slice(0, pageSize);
    const normalizedRows = isPreviousPage ? [...pageRows].reverse() : pageRows;
    const items = normalizedRows.map((row) => mapPollingUnit(row as PollingUnitRow));

    return {
      hasNextPage: isPreviousPage ? Boolean(trimmedCursor) : hasExtraRow,
      hasPreviousPage: isPreviousPage ? hasExtraRow : Boolean(trimmedCursor),
      items,
      nextCursor: items.at(-1)?.id,
      previousCursor: items[0]?.id,
    };
  } catch {
    return {
      hasNextPage: false,
      hasPreviousPage: false,
      items: [],
    };
  }
}

export async function getPollingUnitById(idOrCode: string): Promise<PollingUnit | null> {
  if (!hasServerSupabaseConfig()) return null;

  const value = decodeURIComponent(idOrCode).trim();
  if (!value) return null;

  const select =
    "id, polling_unit_code, polling_unit_name, remark, state_code, state, state_slug, lga, ward, address, latitude, longitude, coordinate_quality, coordinate_confidence, coordinate_source, coordinate_label, coordinate_match, source_snapshot_url, source_generated_at";

  try {
    const supabase = createSupabaseServerClient();
    const byCode = await supabase
      .from("polling_units")
      .select(select)
      .eq("polling_unit_code", value)
      .maybeSingle();

    if (byCode.data && !byCode.error) {
      return mapPollingUnit(byCode.data as PollingUnitRow);
    }

    const byId = await supabase
      .from("polling_units")
      .select(select)
      .eq("id", value)
      .maybeSingle();

    if (byId.data && !byId.error) {
      return mapPollingUnit(byId.data as PollingUnitRow);
    }
  } catch {
    return null;
  }

  return null;
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

export async function getDirectoryStates(): Promise<DirectoryStateOption[]> {
  if (hasServerSupabaseConfig()) {
    try {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("geo_states")
        .select("id, name")
        .order("name", { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((row) => ({ id: row.id as string, name: row.name as string }));
      }
    } catch {
      // fall through to static fallback
    }
  }

  return [...nigeriaGeo]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((state) => ({ id: state.id, name: state.name }));
}
