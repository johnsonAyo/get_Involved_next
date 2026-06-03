import { SubmitCandidatePage } from "./SubmitCandidateClient";
import {
  getDirectoryStates,
  getParties,
  getPositions,
} from "@/lib/content-store.server";

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
