"use client";

import { ErrorFallback } from "@/components/ErrorFallback";

export default function CandidatesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback label="Candidate Directory" error={error} reset={reset} />;
}
