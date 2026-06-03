import { CandidatePage } from "../CandidateClient";
import { getCandidates } from "@/lib/content-store.server";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidates = await getCandidates();

  return <CandidatePage candidateId={id} candidates={candidates} />;
}
