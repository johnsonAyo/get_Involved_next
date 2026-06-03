import { createClient } from "@sanity/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

const debugQuery = `{
  "candidateCount": count(*[_type == "candidate" && display != false]),
  "partyCount": count(*[_type == "party"]),
  "positionCount": count(*[_type == "position"]),
  "candidateIds": *[_type == "candidate" && display != false][0...20]._id,
  "partyIds": *[_type == "party"][0...20]._id,
  "positionIds": *[_type == "position"][0...20]._id
}`;

async function runCheck(label, client, options) {
  try {
    const result = await client.fetch(debugQuery, {}, options);
    return { label, ok: true, result };
  } catch (error) {
    return {
      label,
      ok: false,
      error: error?.message || String(error),
    };
  }
}

async function main() {
  loadDotEnv();

  const projectId =
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() ||
    requiredEnv("VITE_SANITY_PROJECT_ID");
  const dataset =
    process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() ||
    requiredEnv("VITE_SANITY_DATASET");
  const apiVersion =
    process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() ||
    process.env.VITE_SANITY_API_VERSION?.trim() ||
    "2026-05-31";
  const token = process.env.SANITY_API_WRITE_TOKEN?.trim();

  const baseConfig = {
    apiVersion,
    dataset,
    projectId,
    useCdn: false,
  };

  const publicClient = createClient(baseConfig);
  const tokenClient = token ? createClient({ ...baseConfig, token }) : null;

  const checks = [
    runCheck("public default", publicClient),
  ];

  if (tokenClient) {
    checks.push(runCheck("token default", tokenClient));
    checks.push(runCheck("token published perspective", tokenClient, { perspective: "published" }));
    checks.push(runCheck("token raw perspective", tokenClient, { perspective: "raw" }));
  }

  const results = await Promise.all(checks);

  console.log(
    JSON.stringify(
      {
        projectId,
        dataset,
        apiVersion,
        results,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
