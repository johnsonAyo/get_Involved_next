import { hasSanityConfig } from "../sanity/env";

export async function fetchSanity<T>(
  operation: string,
  params: Record<string, unknown> = {},
) {
  if (!hasSanityConfig) return null;

  try {
    const response = await fetch("/api/sanity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ operation, params }),
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}
