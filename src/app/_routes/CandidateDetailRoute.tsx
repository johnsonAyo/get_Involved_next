"use client";

import { useRouter } from "next/navigation";
import { CandidatePage } from "@/vite-pages/CandidatePage";

type Props = {
  candidateId: string;
};

export default function CandidateDetailRoute({ candidateId }: Props) {
  const router = useRouter();

  return <CandidatePage candidateId={candidateId} onNavigate={(path) => router.push(path)} />;
}
