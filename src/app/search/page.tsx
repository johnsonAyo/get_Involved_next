import { CandidatePage } from "../candidates/CandidateClient";
import { getCandidates } from "@/lib/content-store.server";

export const dynamic = "force-dynamic";

export default async function Page() {
  const candidates = await getCandidates();

  return <CandidatePage candidates={candidates} />;
}
