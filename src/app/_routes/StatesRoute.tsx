"use client";

import { useRouter } from "next/navigation";
import { StatesPage } from "@/vite-pages/StatesPage";

export default function StatesRoute() {
  const router = useRouter();

  return <StatesPage onNavigate={(path) => router.push(path)} />;
}
