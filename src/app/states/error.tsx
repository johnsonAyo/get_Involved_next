"use client";

import { ErrorFallback } from "@/components/ErrorFallback";

export default function StatesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback label="State Directory" error={error} reset={reset} />;
}
