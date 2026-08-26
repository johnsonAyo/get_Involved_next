import type { Metadata } from "next";
import { Suspense } from "react";
import { HomePage } from "./HomeClient";
import {
  getCandidates,
  getFacts,
  getPollingUnitStateStats,
} from "@/lib/content-store.server";

export const metadata: Metadata = {
  title: "Get Involved | Know Your Candidates — Nigeria Election Directory",
  description:
    "Search any candidate name. Select your state and local government. See every party contesting and exactly who is on the ballot.",
};

export const revalidate = 300;

export default async function Page() {
  const [candidates, facts, pollingUnitStateStats] = await Promise.all([
    getCandidates(),
    getFacts(),
    getPollingUnitStateStats(),
  ]);

  return (
    <Suspense fallback={null}>
      <HomePage
        candidates={candidates}
        facts={facts}
        pollingUnitStateStats={pollingUnitStateStats}
      />
    </Suspense>
  );
}
