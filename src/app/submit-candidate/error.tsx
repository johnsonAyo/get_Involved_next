"use client";

import { ErrorFallback } from "@/components/ErrorFallback";

export default function SubmitCandidateError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback label="Submit Candidate" error={error} reset={reset} />;
}
