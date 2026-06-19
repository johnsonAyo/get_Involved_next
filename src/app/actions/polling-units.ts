"use server";

import { createClient } from "@supabase/supabase-js";

function formatPollingUnitText(str?: string | null): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/(?:^|\s|-|\/)\\S/g, (match) => match.toUpperCase());
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
 * Fetch all states from the geo_states lookup table.
 * Returns sorted by name.
 */
export async function getGeoStates(): Promise<GeoState[]> {
  const supabase = createServerSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("geo_states")
      .select("id, name")
      .order("name", { ascending: true });

    if (error || !data) {
      console.error("Failed to fetch geo_states:", error);
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      name: formatPollingUnitText(row.name),
    }));
  } catch (err) {
    console.error("Error in getGeoStates:", err);
    return [];
  }
}

/**
 * Fetch LGAs for a given state slug from the geo_lgas lookup table.
 */
export async function getPollingUnitLgas(stateSlug: string): Promise<string[]> {
  if (!stateSlug) return [];

  const supabase = createServerSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("geo_lgas")
      .select("name")
      .eq("state_id", stateSlug.trim().toLowerCase())
      .order("name", { ascending: true });

    if (error || !data) {
      console.error("Failed to fetch LGAs for state_slug:", stateSlug, error);
      return [];
    }

    return data
      .map((row) => formatPollingUnitText(row.name))
      .filter(Boolean);
  } catch (err) {
    console.error("Error in getPollingUnitLgas:", err);
    return [];
  }
}

/**
 * Fetch wards for a given state slug + LGA name from the geo_wards lookup table.
 */
export async function getPollingUnitWards(
  stateSlug: string,
  lga: string,
): Promise<string[]> {
  if (!stateSlug || !lga) return [];

  const supabase = createServerSupabase();
  if (!supabase) return [];

  try {
    // First get the LGA id
    const { data: lgaRows, error: lgaError } = await supabase
      .from("geo_lgas")
      .select("id")
      .eq("state_id", stateSlug.trim().toLowerCase())
      .ilike("name", lga.trim())
      .limit(1);

    if (lgaError || !lgaRows || lgaRows.length === 0) {
      console.error("Failed to find LGA:", stateSlug, lga, lgaError);
      return [];
    }

    const lgaId = lgaRows[0].id;

    const { data, error } = await supabase
      .from("geo_wards")
      .select("name")
      .eq("lga_id", lgaId)
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
