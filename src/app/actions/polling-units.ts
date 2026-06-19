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
