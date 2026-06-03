"use client";

import { useRouter } from "next/navigation";
import { SubmitCandidatePage } from "@/vite-pages/SubmitCandidatePage";

export default function SubmitCandidateRoute() {
  const router = useRouter();

  return <SubmitCandidatePage onNavigate={(path) => router.push(path)} />;
}
