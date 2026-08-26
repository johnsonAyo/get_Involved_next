import type { Metadata } from "next";
import { Suspense } from "react";
import { StatesPage } from "./StatesClient";
import { getCandidates } from "@/lib/content-store.server";

export const metadata: Metadata = {
  title: "Nigerian States & Candidates | Get Involved",
  description:
    "Browse candidates by state across all 36 Nigerian states and the FCT. Filter by local government area.",
};

export const revalidate = 300;

export default async function Page() {
  const candidates = await getCandidates();

  return (
    <Suspense fallback={null}>
      <StatesPage candidates={candidates} />
    </Suspense>
  );
}
