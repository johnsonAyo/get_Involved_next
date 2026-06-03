import { useQuery } from "@tanstack/react-query";
import { fetchCandidates } from "../data/candidates.js";
import { queryKeys } from "../lib/queryKeys";
import type { Candidate } from "../types/domain";

export function useCandidates() {
  return useQuery<Candidate[]>({
    queryKey: queryKeys.candidates,
    queryFn: async () => (await fetchCandidates()) as Candidate[],
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}
