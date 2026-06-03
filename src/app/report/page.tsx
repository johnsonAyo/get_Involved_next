"use client";

import dynamic from "next/dynamic";

const ReportRoute = dynamic(() => import("../_routes/ReportRoute"), { ssr: false });

export default function Page() {
  return <ReportRoute />;
}
