import { useState, useEffect } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { PageBreadcrumb } from "../components/PageBreadcrumb";
import { SafeCandidateCard } from "../components/SafeCandidateCard";
import { DropdownSelect } from "../components/DropdownSelect";
import { Pagination } from "../components/Pagination";
import { nigeriaGeo, getLgas } from "../data/nigeria.js";
import { usePagination } from "../hooks/usePagination";
import { useCandidates } from "../hooks/useCandidates";

const CANDIDATES_PER_PAGE = 12;

type Props = {
  candidateId?: string;
  onNavigate: (path: string) => void;
};

export function CandidatePage({ candidateId, onNavigate }: Props) {
  const { data: candidates = [], isLoading } = useCandidates();

  const queryParams = new URLSearchParams(window.location.search);
  const initialQuery = queryParams.get("query") || "";
  const initialParty = queryParams.get("party") || "";
  const initialPosition = queryParams.get("position") || "";
  const initialStateId = queryParams.get("state") || "";
  const initialLga = queryParams.get("lga") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedParty, setSelectedParty] = useState(initialParty);
  const [selectedPosition, setSelectedPosition] = useState(initialPosition);
  const [selectedStateId, setSelectedStateId] = useState(initialStateId);
  const [selectedLga, setSelectedLga] = useState(initialLga);

  const isListMode = !candidateId;
  const candidate = isListMode
    ? null
    : candidates.find((c) => String(c.id) === String(candidateId));

  const sortedStates = [...nigeriaGeo].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const lgas = selectedStateId ? getLgas(selectedStateId) : [];

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("query", searchQuery);
    if (selectedParty) params.set("party", selectedParty);
    if (selectedPosition) params.set("position", selectedPosition);
    if (selectedStateId) params.set("state", selectedStateId);
    if (selectedLga) params.set("lga", selectedLga);

    const newQueryStr = params.toString();
    const newPath = newQueryStr ? `/candidates?${newQueryStr}` : "/candidates";

    if (window.location.search !== (newQueryStr ? `?${newQueryStr}` : "")) {
      window.history.replaceState({}, "", newPath);
    }
  }, [
    searchQuery,
    selectedParty,
    selectedPosition,
    selectedStateId,
    selectedLga,
  ]);

  const parties = Array.from(
    new Map(
      candidates
        .filter((candidate) => candidate.partyId && candidate.party)
        .map((candidate) => [
          candidate.partyId!,
          {
            id: candidate.partyId!,
            name: candidate.partyFullName || candidate.party,
            abbreviation: candidate.party,
          },
        ]),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));
  const positions = Array.from(
    new Set(candidates.map((candidate) => candidate.position).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));

  const matchedCandidates = candidates.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      (c.candidateName || "").toLowerCase().includes(q) ||
      (c.viceCandidateName || "").toLowerCase().includes(q) ||
      (c.party || "").toLowerCase().includes(q) ||
      (c.partyFullName || "").toLowerCase().includes(q) ||
      (c.position || "").toLowerCase().includes(q) ||
      (c.stateName || c.state || "").toLowerCase().includes(q) ||
      (c.lga || "").toLowerCase().includes(q);

    const matchesPosition =
      !selectedPosition || c.position === selectedPosition;
    const matchesParty = !selectedParty || c.partyId === selectedParty;
    const matchesState =
      !selectedStateId ||
      c.stateId?.toLowerCase() === selectedStateId.toLowerCase();
    const matchesLga =
      !selectedLga || c.lga?.toLowerCase() === selectedLga.toLowerCase();

    return (
      matchesQuery &&
      matchesParty &&
      matchesPosition &&
      matchesState &&
      matchesLga
    );
  });
  const {
    currentPage,
    firstItemIndex,
    pageCount,
    pageNumbers,
    setCurrentPage,
  } = usePagination({
    itemCount: matchedCandidates.length,
    pageSize: CANDIDATES_PER_PAGE,
    resetDependencies: [
      searchQuery,
      selectedParty,
      selectedPosition,
      selectedStateId,
      selectedLga,
    ],
  });
  const paginatedCandidates = matchedCandidates.slice(
    firstItemIndex,
    firstItemIndex + CANDIDATES_PER_PAGE,
  );

  return (
    <>
      <SiteHeader onNavigate={onNavigate} />

      <main
        id="main-content"
        style={{ padding: "3rem 1rem", minHeight: "60vh" }}
      >
        <div
          style={{
            maxWidth: isListMode ? "var(--ds-frame)" : "32rem",
            margin: "0 auto",
          }}
        >
          <PageBreadcrumb
            items={
              isListMode
                ? [
                    { href: "/", label: "Home", onClick: () => onNavigate("/") },
                    { label: "Candidates" },
                  ]
                : [
                    { href: "/", label: "Home", onClick: () => onNavigate("/") },
                    {
                      href: "/candidates",
                      label: "Candidates",
                      onClick: () => onNavigate("/candidates"),
                    },
                    { label: "Candidate Profile" },
                  ]
            }
          />

          {isLoading ? (
            <p className="ds-eyebrow" style={{ textAlign: "center" }}>
              {isListMode
                ? "Loading candidates..."
                : "Loading candidate details..."}
            </p>
          ) : isListMode ? (
            <div style={{ marginTop: "1rem" }}>
              <h1
                style={{
                  marginBottom: "2rem",
                  fontFamily: "var(--ds-font-display)",
                  fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
                }}
              >
                Candidates &amp; Parties
              </h1>

              {/* Filter Panel */}
              <form
                className="search-filter"
                style={{
                  marginBottom: "3rem",
                  padding: "1.5rem",
                  border: "var(--ds-rule-medium) solid var(--ds-color-ink)",
                  background: "var(--ds-color-surface)",
                }}
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="search-filter__field search-filter__field--full">
                  <label
                    className="ds-eyebrow search-filter__label"
                    htmlFor="filter-query"
                  >
                    <span className="ds-desktop-only">Candidate, running mate, or party</span>
                    <span className="ds-mobile-only">Candidate/Party</span>
                  </label>
                  <div className="search-filter__input-wrap">
                    <svg
                      aria-hidden="true"
                      className="search-filter__icon"
                      fill="none"
                      height="18"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      width="18"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" x2="16.65" y1="21" y2="16.65" />
                    </svg>
                    <input
                      autoComplete="off"
                      className="search-filter__input"
                      id="filter-query"
                      placeholder="Search name"
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="search-filter__row">
                  <div className="search-filter__field">
                    <label
                      className="ds-eyebrow search-filter__label"
                      htmlFor="filter-party"
                    >
                      Party
                    </label>
                    <DropdownSelect
                      id="filter-party"
                      onChange={setSelectedParty}
                      options={parties.map((party) => ({
                        listLabel: `${party.name} (${party.abbreviation})`,
                        selectedLabel: party.name,
                        value: party.id,
                      }))}
                      placeholder="All Parties"
                      value={selectedParty}
                    />
                  </div>

                  <div className="search-filter__field">
                    <label
                      className="ds-eyebrow search-filter__label"
                      htmlFor="filter-position"
                    >
                      Position
                    </label>
                    <DropdownSelect
                      id="filter-position"
                      onChange={setSelectedPosition}
                      options={positions.map((position) => ({
                        listLabel: position,
                        value: position,
                      }))}
                      placeholder="All Positions"
                      value={selectedPosition}
                    />
                  </div>

                  <div className="search-filter__field">
                    <label
                      className="ds-eyebrow search-filter__label"
                      htmlFor="filter-state"
                    >
                      State
                    </label>
                    <DropdownSelect
                      id="filter-state"
                      onChange={(state) => {
                        setSelectedStateId(state);
                        setSelectedLga("");
                      }}
                      options={sortedStates.map((state) => ({
                        listLabel: state.name,
                        value: state.id,
                      }))}
                      placeholder="All States"
                      value={selectedStateId}
                    />
                  </div>

                  <div className="search-filter__field">
                    <label
                      className="ds-eyebrow search-filter__label"
                      htmlFor="filter-lga"
                    >
                      <span className="ds-desktop-only">Local Government</span>
                      <span className="ds-mobile-only">LGA</span>
                    </label>
                    <DropdownSelect
                      id="filter-lga"
                      disabled={!selectedStateId}
                      onChange={setSelectedLga}
                      options={lgas.map((localGovernment) => ({
                        listLabel: localGovernment,
                        value: localGovernment,
                      }))}
                      placeholder={
                        selectedStateId
                          ? "All Local Governments"
                          : "Select a state first"
                      }
                      value={selectedLga}
                    />
                  </div>
                </div>

                {(searchQuery ||
                  selectedParty ||
                  selectedPosition ||
                  selectedStateId ||
                  selectedLga) && (
                  <button
                    type="button"
                    className="ds-button ds-button--ghost"
                    style={{
                      width: "fit-content",
                      minHeight: "2.5rem",
                      padding: "0.5rem 1rem",
                      fontSize: "0.85rem",
                      marginTop: "0.5rem",
                    }}
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedParty("");
                      setSelectedPosition("");
                      setSelectedStateId("");
                      setSelectedLga("");
                    }}
                  >
                    ← Clear All Filters
                  </button>
                )}
              </form>

              {matchedCandidates.length > 0 ? (
                <>
                  <ul
                    className="recent__grid"
                    style={{ listStyle: "none", padding: 0, margin: 0 }}
                  >
                    {paginatedCandidates.map((c) => (
                      <SafeCandidateCard
                        key={c.id}
                        candidate={c}
                        onNavigate={onNavigate}
                      />
                    ))}
                  </ul>
                  <Pagination
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    pageCount={pageCount}
                    pageNumbers={pageNumbers}
                  />
                </>
              ) : (
                <div
                  className="search-filter__no-results"
                  style={{
                    padding: "3rem 1.5rem",
                    border: "1px dashed var(--ds-color-ink-a10)",
                    textAlign: "center",
                    background: "var(--ds-color-surface)",
                  }}
                >
                  <p className="ds-eyebrow">No Candidates Found</p>
                  <p
                    style={{
                      color: "var(--ds-color-ink-muted)",
                      marginTop: "0.5rem",
                    }}
                  >
                    Try adjusting your search terms or submit a candidate.
                  </p>
                  <button
                    className="ds-button ds-button--primary"
                    onClick={() => onNavigate("/submit-candidate")}
                    style={{ margin: "1rem auto 0", cursor: "pointer" }}
                    type="button"
                  >
                    Submit a Candidate
                  </button>
                </div>
              )}
            </div>
          ) : candidate ? (
            <div style={{ marginTop: "1rem" }}>
              <h1
                style={{
                  marginBottom: "2rem",
                  fontFamily: "var(--ds-font-display)",
                  fontSize: "2rem",
                }}
              >
                Candidate Profile
              </h1>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                <SafeCandidateCard candidate={candidate} onNavigate={onNavigate} />
              </ul>
            </div>
          ) : (
            <div style={{ textAlign: "center", marginTop: "4rem" }}>
              <p
                className="ds-eyebrow"
                style={{ color: "var(--ds-color-ink-soft)" }}
              >
                Not Found
              </p>
              <h2 style={{ fontFamily: "var(--ds-font-display)" }}>
                Candidate not found
              </h2>
              <p style={{ marginTop: "1rem" }}>
                We couldn't find a candidate matching that ID in our directory.
              </p>
            </div>
          )}
        </div>
      </main>

      <SiteFooter onNavigate={onNavigate} />
    </>
  );
}
