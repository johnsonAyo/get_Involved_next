import type { Metadata } from "next";
import { CandidatePage } from "./CandidateClient";
import { getCandidates } from "@/lib/content-store.server";

export const metadata: Metadata = {
  title: "Candidate Directory | Get Involved",
  description:
    "Browse Nigerian election candidates by office, party, state, and local government. Search the full candidate directory.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function readSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : undefined;
}

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (searchParams ? await searchParams : {}) as SearchParams;
  const candidates = await getCandidates();

  return (
    <CandidatePage
      candidates={candidates}
      initialFilters={{
        lga: readSearchParam(params.lga) || "",
        party: readSearchParam(params.party) || "",
        position: readSearchParam(params.position) || "",
        query: readSearchParam(params.query) || "",
        state: readSearchParam(params.state) || "",
      }}
    />
  );
}
