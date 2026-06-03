"use client";

import dynamic from "next/dynamic";

const CandidatesRoute = dynamic(() => import("../_routes/CandidatesRoute"), {
  ssr: false,
});

export default function Page() {
  return <CandidatesRoute />;
}
