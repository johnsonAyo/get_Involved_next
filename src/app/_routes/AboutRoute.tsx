"use client";

import { useRouter } from "next/navigation";
import { AboutPage } from "@/vite-pages/About";

export default function AboutRoute() {
  const router = useRouter();

  return <AboutPage onNavigate={(path) => router.push(path)} />;
}
