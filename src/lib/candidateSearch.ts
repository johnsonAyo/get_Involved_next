export type CandidateSearchParams = {
  query?: string;
  party?: string;
  position?: string;
  state?: string;
  lga?: string;
};

export function toCandidateSearchString(params: CandidateSearchParams): string {
  const searchParams = new URLSearchParams();
  if (params.query?.trim()) searchParams.set("query", params.query.trim());
  if (params.party) searchParams.set("party", params.party);
  if (params.position) searchParams.set("position", params.position);
  if (params.state) searchParams.set("state", params.state);
  if (params.lga) searchParams.set("lga", params.lga);
  return searchParams.toString();
}

export function toCandidateSearchPath(params: CandidateSearchParams): string {
  const queryString = toCandidateSearchString(params);
  return queryString ? `/candidates?${queryString}` : "/candidates";
}
