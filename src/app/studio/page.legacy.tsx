"use client";

import dynamic from "next/dynamic";

const StudioRoute = dynamic(() => import("../_routes/StudioRoute"), { ssr: false });

export default function Page() {
  return <StudioRoute />;
}
