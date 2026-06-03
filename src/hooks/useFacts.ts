import { useQuery } from "@tanstack/react-query";
import { fetchFacts } from "../data/facts.js";
import { queryKeys } from "../lib/queryKeys";
import type { Fact } from "../types/domain";

export function useFacts() {
  return useQuery<Fact[]>({
    queryKey: queryKeys.facts,
    queryFn: async () => (await fetchFacts()) as Fact[],
  });
}
