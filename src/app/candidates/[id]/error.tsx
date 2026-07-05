"use client";

import { ErrorFallback } from "@/components/ErrorFallback";

export default function CandidateDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback label="Candidate Profile" error={error} reset={reset} />;
}
