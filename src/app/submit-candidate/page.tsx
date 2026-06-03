"use client";

import dynamic from "next/dynamic";

const SubmitCandidateRoute = dynamic(
  () => import("../_routes/SubmitCandidateRoute"),
  { ssr: false },
);

export default function Page() {
  return <SubmitCandidateRoute />;
}
