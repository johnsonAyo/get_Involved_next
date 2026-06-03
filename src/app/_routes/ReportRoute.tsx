"use client";

import { useRouter } from "next/navigation";
import { ReportPage } from "@/vite-pages/ReportPage";

export default function ReportRoute() {
  const router = useRouter();

  return <ReportPage onNavigate={(path) => router.push(path)} />;
}
