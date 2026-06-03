"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

const CandidateDetailRoute = dynamic(
  () => import("../../_routes/CandidateDetailRoute"),
  { ssr: false },
);

export default function Page() {
  const params = useParams<{ id: string }>();

  return <CandidateDetailRoute candidateId={params.id} />;
}
