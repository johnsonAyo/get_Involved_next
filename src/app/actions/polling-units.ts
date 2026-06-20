"use server";

import { createClient } from "@supabase/supabase-js";
import { nigeriaGeo } from "@/data/nigeria.js";

function formatPollingUnitText(str?: string | null): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/(?:^|\s|-|\/)\S/g, (match) => match.toUpperCase());
}

function createServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export type GeoState = {
  id: string;
  name: string;
};

/**
 * Fetch all states from the geo_states lookup table, falling back to local geography data.
 */
export async function getGeoStates(): Promise<GeoState[]> {
  const supabase = createServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("geo_states")
        .select("id, name")
        .order("name", { ascending: true });

      if (!error && data) {
        return data.map((row) => ({
          id: row.id,
          name: formatPollingUnitText(row.name),
        }));
      }
    } catch (err) {
      console.error("Error in getGeoStates DB query:", err);
    }
  }

  return [...nigeriaGeo]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((state) => ({
      id: state.id,
      name: state.name,
    }));
}

/**
 * Fetch LGAs for a given state slug from the geo_lgas lookup table, falling back to local geography data.
 */
export async function getPollingUnitLgas(stateSlug: string): Promise<string[]> {
  if (!stateSlug) return [];

  const supabase = createServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("geo_lgas")
        .select("name")
        .eq("state_id", stateSlug.trim().toLowerCase())
        .order("name", { ascending: true });

      if (!error && data) {
        return data
          .map((row) => formatPollingUnitText(row.name))
          .filter(Boolean);
      }
    } catch (err) {
      console.error("Error in getPollingUnitLgas DB query:", err);
    }
  }

  const state = nigeriaGeo.find((s) => s.id === stateSlug.trim().toLowerCase());
  if (!state || !state.lgas) return [];
  return [...state.lgas].sort((a, b) => a.localeCompare(b));
}

/**
 * Fetch wards for a given state slug + LGA name from the geo_wards lookup table.
 * Optimised to use a single inner-join database query.
 */
export async function getPollingUnitWards(
  stateSlug: string,
  lga: string,
): Promise<string[]> {
  if (!stateSlug || !lga) return [];

  const supabase = createServerSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("geo_wards")
      .select("name, geo_lgas!inner(name, state_id)")
      .eq("geo_lgas.state_id", stateSlug.trim().toLowerCase())
      .ilike("geo_lgas.name", lga.trim())
      .order("name", { ascending: true });

    if (error || !data) {
      console.error("Failed to fetch Wards for LGA:", lga, error);
      return [];
    }

    return data
      .map((row) => formatPollingUnitText(row.name))
      .filter(Boolean);
  } catch (err) {
    console.error("Error in getPollingUnitWards:", err);
    return [];
  }
}

export type GeoPollingUnit = {
  id: string;
  code: string;
  name: string;
};

/**
 * Fetch polling units for a given state + LGA + ward.
 *
 * Reads from the `polling_units` *view* (defined in
 * supabase/schema.sql), which flattens `polling_units_core` together
 * with the geo_wards → geo_lgas → geo_states chain so a single query
 * can filter by `state_slug`, `lga`, and `ward` in one shot — same
 * pattern used by `getPollingUnits` in `src/lib/content-store.server.ts`.
 *
 * This is the deepest tier of the cascading filter. There is no
 * local fallback (nigeria.js ships state→LGA only, no ward/PU data).
 * If Supabase isn't configured or no rows match for this ward, the
 * action returns an empty array and the tier renders an empty
 * dropdown rather than spinning forever.
 */
export async function getPollingUnitsForWard(
  stateSlug: string,
  lga: string,
  ward: string,
): Promise<GeoPollingUnit[]> {
  if (!stateSlug || !lga || !ward) return [];

  const supabase = createServerSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("polling_units")
      .select("id, polling_unit_code, polling_unit_name")
      .eq("state_slug", stateSlug.trim().toLowerCase())
      .ilike("lga", lga.trim())
      .ilike("ward", ward.trim())
      .order("polling_unit_name", { ascending: true })
      .limit(500);

    if (error || !Array.isArray(data)) {
      console.error("Failed to fetch Polling Units for ward:", ward, error);
      return [];
    }

    return data
      .map((row) => ({
        id: row.id,
        code: row.polling_unit_code ?? "",
        name: formatPollingUnitText(row.polling_unit_name),
      }))
      .filter((row) => Boolean(row.name));
  } catch (err) {
    console.error("Error in getPollingUnitsForWard:", err);
    return [];
  }
}
