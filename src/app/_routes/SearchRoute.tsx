"use client";

import { useRouter } from "next/navigation";
import { CandidatePage } from "@/vite-pages/CandidatePage";

export default function SearchRoute() {
  const router = useRouter();

  return <CandidatePage onNavigate={(path) => router.push(path)} />;
}
