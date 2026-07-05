import type { Metadata } from "next";
import { CandidatePage } from "../candidates/CandidateClient";
import { getCandidates } from "@/lib/content-store.server";

export const metadata: Metadata = {
  title: "Search Candidates | Get Involved",
  description:
    "Search Nigerian election candidates by name, party, office, state, and local government area.",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const candidates = await getCandidates();

  return <CandidatePage candidates={candidates} />;
}
