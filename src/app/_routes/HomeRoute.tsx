"use client";

import { useRouter } from "next/navigation";
import { HomePage } from "@/vite-pages/HomePage";

export default function HomeRoute() {
  const router = useRouter();

  return <HomePage onNavigate={(path) => router.push(path)} />;
}
