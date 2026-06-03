"use client";

import dynamic from "next/dynamic";

const StatesRoute = dynamic(() => import("../_routes/StatesRoute"), { ssr: false });

export default function Page() {
  return <StatesRoute />;
}
