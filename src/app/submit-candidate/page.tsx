import type { Metadata } from "next";
import { SubmitCandidatePage } from "./SubmitCandidateClient";
import {
  getDirectoryStates,
  getParties,
  getPositions,
} from "@/lib/content-store.server";

export const metadata: Metadata = {
  title: "Submit a Candidate | Get Involved",
  description:
    "Add a candidate to the public record. Submit an aspirant's details with a verifiable public source.",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const [positions, states, parties] = await Promise.all([
    getPositions(),
    getDirectoryStates(),
    getParties(),
  ]);

  return (
    <SubmitCandidatePage
      parties={parties}
      positions={positions}
      states={states}
    />
  );
}
