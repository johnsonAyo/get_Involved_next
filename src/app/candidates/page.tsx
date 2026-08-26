import type { Metadata } from "next";
import { Suspense } from "react";
import { CandidatePage } from "./CandidateClient";
import { getCandidates } from "@/lib/content-store.server";

export const metadata: Metadata = {
  title: "Candidate Directory | Get Involved",
  description:
    "Browse Nigerian election candidates by office, party, state, and local government. Search the full candidate directory.",
};

export const revalidate = 300;

export default async function Page() {
  const candidates = await getCandidates();

  return (
    <Suspense fallback={null}>
        <CandidatePage candidates={candidates} />
    </Suspense>
  );
}
