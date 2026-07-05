"use client";

import { ErrorFallback } from "@/components/ErrorFallback";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback label="Get Involved" error={error} reset={reset} />;
}
