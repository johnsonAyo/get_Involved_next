import { useEffect, useLayoutEffect } from "react";

/**
 * `useLayoutEffect` emits a hydration warning when the component is
 * server-rendered. Use this alias in components mounted at the root
 * layout level so the server pass uses `useEffect` and the client
 * pass uses `useLayoutEffect`.
 *
 * The runtime check is evaluated at hook-call time (not module-load
 * time) so the helper is safe under shared or partially-evaluated
 * module-bundle contexts.
 */
export const useIsomorphicLayoutEffect: typeof useLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;
