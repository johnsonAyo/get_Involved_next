import { useMemo } from "react";
import { getLgas } from "../data/nigeria.js";
import { sortedStates } from "../constants/nigeria";
import { toCandidateSearchString } from "../lib/candidateSearch";
import { useUrlSyncedState } from "./useUrlSyncedState";
import type { Candidate } from "../types/domain";

type Filters = {
  query: string;
  party: string;
  position: string;
  stateId: string;
  lga: string;
};

function parseFilters(params: URLSearchParams): Filters {
  return {
    query: params.get("query") ?? "",
    party: params.get("party") ?? "",
    position: params.get("position") ?? "",
    stateId: params.get("state") ?? "",
    lga: params.get("lga") ?? "",
  };
}

function serializeFilters(filters: Filters): URLSearchParams {
  const params = new URLSearchParams(toCandidateSearchString({
    query: filters.query,
    party: filters.party,
    position: filters.position,
    state: filters.stateId,
    lga: filters.lga,
  }));
  return params;
}

export function useCandidateDirectoryFilters(candidates: Candidate[]) {
  const { value: filters, setValue: setFilters } = useUrlSyncedState<Filters>({
    parse: parseFilters,
    serialize: serializeFilters,
    toPath: (queryString) => (queryString ? `/candidates?${queryString}` : "/candidates"),
  });

  const positions = useMemo(
    () =>
      Array.from(
        new Set(candidates.map((candidate) => candidate.position).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b)),
    [candidates],
  );
  const parties = useMemo(
    () =>
      Array.from(
        new Map(
          candidates
            .filter((candidate) => candidate.partyId && candidate.party)
            .map((candidate) => [
              candidate.partyId!,
              {
                id: candidate.partyId!,
                name: candidate.partyFullName || candidate.party,
                abbreviation: candidate.party,
                logo: candidate.logo,
              },
            ]),
        ).values(),
      ).sort((a, b) => a.name.localeCompare(b.name)),
    [candidates],
  );
  const lgas = useMemo(() => (filters.stateId ? getLgas(filters.stateId) : []), [filters.stateId]);

  const filteredCandidates = useMemo(() => {
    const q = filters.query.toLowerCase().trim();
    return candidates.filter((candidate) => {
      const matchesQuery =
        !q ||
        (candidate.candidateName || "").toLowerCase().includes(q) ||
        (candidate.party || "").toLowerCase().includes(q) ||
        (candidate.position || "").toLowerCase().includes(q) ||
        (candidate.stateId || "").toLowerCase().includes(q) ||
        (candidate.lga || "").toLowerCase().includes(q);

      const matchesPosition = !filters.position || candidate.position === filters.position;
      const matchesParty = !filters.party || candidate.partyId === filters.party;
      const matchesState = !filters.stateId || candidate.stateId === filters.stateId;
      const matchesLga = !filters.lga || candidate.lga === filters.lga;

      return matchesQuery && matchesParty && matchesPosition && matchesState && matchesLga;
    });
  }, [candidates, filters.lga, filters.party, filters.position, filters.query, filters.stateId]);

  return {
    filters,
    setFilters,
    filteredCandidates,
    options: {
      positions,
      parties,
      states: sortedStates,
      lgas,
    },
  };
}
