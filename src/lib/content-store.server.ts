
import type {
  Candidate,
  DirectoryStateOption,
  Fact,
  Party,
  PollingUnit,
  PollingUnitStateStat,
} from "@/types/domain";
import { createClient } from "@supabase/supabase-js";
import { nigeriaGeo } from "@/data/nigeria.js";
import { unstable_cache } from "next/cache";

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

// Re-export so client/server can keep the type boundary clean.
export type { PollingUnitStateStat } from "@/types/domain";

const POLLING_UNIT_STATS_PAGE_SIZE = 1000;
const POLLING_UNIT_STATS_MAX_ROWS = 200_000;

type StateAggregate = {
  stateName: string;
  wards: Set<string>;
  lgas: Set<string>;
  count: number;
};

/**
 * Fetch per-state aggregates for the polling_units dataset.
 * Returns each state with its LGA, ward, and polling-unit counts.
 *
 * The result is cached at the framework level (revalidated hourly) so that
 * the home page does not run a full paginated scan on every request.
 *
 * When Supabase is not configured or the table cannot be read, we fall back
 * to a model based on `nigeriaGeo` LGA counts so the UI still has data.
 */
async function fetchPollingUnitStateStats(): Promise<PollingUnitStateStat[]> {
  const fallback = (): PollingUnitStateStat[] =>
    nigeriaGeo
      .map((state) => ({
        stateId: state.id,
        stateName: state.name,
        lgaCount: state.lgas.length,
        wardCount: 0,
        pollingUnitCount: 0,
      }))
      .sort((a, b) =>
        b.lgaCount !== a.lgaCount
          ? b.lgaCount - a.lgaCount
          : a.stateName.localeCompare(b.stateName),
      );

  if (!hasServerSupabaseConfig()) {
    return fallback();
  }

  try {
    const supabase = createSupabaseServerClient();
    if (!supabase) return fallback();

    const aggregates = new Map<string, StateAggregate>();

    // Seed with static metadata so states without any rows still appear.
    for (const state of nigeriaGeo) {
      aggregates.set(state.id, {
        stateName: state.name,
        wards: new Set<string>(),
        lgas: new Set(state.lgas.map((lga) => lga.toLowerCase())),
        count: 0,
      });
    }

    let from = 0;
    let fetched = 0;

    while (fetched < POLLING_UNIT_STATS_MAX_ROWS) {
      const { data, error } = await supabase
        .from("polling_units")
        .select("state_slug, state, lga, ward")
        .range(from, from + POLLING_UNIT_STATS_PAGE_SIZE - 1);

      if (error || !data || data.length === 0) {
        break;
      }

      for (const row of data) {
        const slug = (row.state_slug as string | null)?.toLowerCase();
        if (!slug) continue;
        let bucket = aggregates.get(slug);
        if (!bucket) {
          bucket = {
            stateName:
              typeof row.state === "string" && row.state.length > 0
                ? row.state
                : slug,
            wards: new Set<string>(),
            lgas: new Set<string>(),
            count: 0,
          };
          aggregates.set(slug, bucket);
        }
        bucket.count += 1;
        if (row.ward) bucket.wards.add(String(row.ward));
        if (row.lga) bucket.lgas.add(String(row.lga).toLowerCase());
      }

      fetched += data.length;
      if (data.length < POLLING_UNIT_STATS_PAGE_SIZE) {
        break;
      }
      from += POLLING_UNIT_STATS_PAGE_SIZE;
    }

    const results: PollingUnitStateStat[] = [];
    for (const [stateId, bucket] of aggregates.entries()) {
      const staticState = nigeriaGeo.find((state) => state.id === stateId);
      results.push({
        stateId,
        stateName: staticState?.name ?? bucket.stateName ?? stateId,
        // Always trust the static LGA list because the polling_units table
        // only contains rows for states that have been imported so far.
        lgaCount: staticState ? staticState.lgas.length : bucket.lgas.size,
        wardCount: bucket.wards.size,
        pollingUnitCount: bucket.count,
      });
    }

    return results.sort((a, b) => {
      if (b.pollingUnitCount !== a.pollingUnitCount) {
        return b.pollingUnitCount - a.pollingUnitCount;
      }
      if (b.lgaCount !== a.lgaCount) {
        return b.lgaCount - a.lgaCount;
      }
      return a.stateName.localeCompare(b.stateName);
    });
  } catch {
    return fallback();
  }
}

export const getPollingUnitStateStats = unstable_cache(
  fetchPollingUnitStateStats,
  ["polling-unit-state-stats"],
  { revalidate: 3600 },
);
