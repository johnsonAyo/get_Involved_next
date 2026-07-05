"use client";

import { ErrorFallback } from "@/components/ErrorFallback";

export default function SearchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback label="Search" error={error} reset={reset} />;
}
