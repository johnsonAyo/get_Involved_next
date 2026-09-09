import type { Metadata } from "next";
import { Suspense } from "react";
import { CandidatePage } from "../candidates/CandidateClient";
import { getCandidates } from "@/lib/content-store.server";

export const metadata: Metadata = {
  title: "Search Candidates | Get Involved",
  description:
    "Search Nigerian election candidates by name, party, office, state, and local government area.",
};

export const revalidate = 86400;

export default async function Page() {
  const candidates = await getCandidates();

  return (
    <Suspense fallback={null}>
      <CandidatePage candidates={candidates} />
    </Suspense>
  );
}
