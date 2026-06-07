"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { SafeCandidateCard } from "@/components/SafeCandidateCard";
import { DropdownSelect } from "@/components/DropdownSelect";
import { Pagination } from "@/components/Pagination";
import { nigeriaGeo, getLgas, getState } from "@/data/nigeria.js";
import { usePagination } from "@/hooks/usePagination";
import type { Candidate } from "@/types/domain";
import { formatPositionName } from "@/utils/formatters";

const CANDIDATES_PER_PAGE = 12;

function normalizeSources(source: Candidate["source"]): string[] {
  if (Array.isArray(source)) {
    return source.filter((item) => item.trim().length > 0);
  }

  return source?.trim() ? [source] : [];
}

function getSourceHost(source: string): string {
  try {
    const host = new URL(source).hostname.replace(/^www\./, "");
    return host || source;
  } catch {
    return source;
  }
}

function getCandidateInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
  return `${first}${last}`.toUpperCase() || "C";
}

function getCandidateLocation(candidate: Candidate): string {
  const stateFromId = candidate.stateId
    ? (getState(candidate.stateId.toLowerCase()) as { name: string } | undefined)
    : undefined;
  const stateName = stateFromId?.name || candidate.stateName || candidate.state || "";

  return [candidate.lga, stateName].filter(Boolean).join(", ");
}

function CandidateProfile({ candidate }: { candidate: Candidate }) {
  const sources = normalizeSources(candidate.source);
  const position = formatPositionName(candidate.position) || candidate.position || "Office";
  const location = getCandidateLocation(candidate);
  const partyName = candidate.partyFullName || candidate.party || "Not listed";
  const initials = getCandidateInitials(candidate.candidateName);

  return (
    <article className="candidate-profile" aria-labelledby="candidate-profile-title">
      <PageBreadcrumb
        items={[
          { href: "/", label: "Home" },
          { href: "/candidates", label: "Candidates" },
          { label: candidate.candidateName },
        ]}
      />

      <div className="candidate-profile__grid">
        <div className="candidate-profile__sidebar">
          <section className="candidate-profile__hero">
            <div className="candidate-profile__identity">
              <div className="candidate-profile__avatar-wrap">
                {candidate.profilePictureUrl ? (
                  <img
                    alt={`${candidate.candidateName} profile picture`}
                    className="candidate-profile__avatar"
                    src={candidate.profilePictureUrl}
                  />
                ) : (
                  <div className="candidate-profile__avatar candidate-profile__avatar--initials" aria-hidden="true">
                    {initials}
                  </div>
                )}
              </div>

              <div className="candidate-profile__heading">
                <h1 id="candidate-profile-title">{candidate.candidateName}</h1>
                <div className="candidate-profile__top-facts" aria-label="Candidate summary">
                  <div>
                    <p className="ds-eyebrow">Position</p>
                    <p>{position}</p>
                  </div>
                  <div>
                    <p className="ds-eyebrow">Age</p>
                    <p>Not listed</p>
                  </div>
                </div>
                {location ? (
                  <p className="candidate-profile__subtitle">{location}</p>
                ) : null}
                <div className="candidate-profile__party-card">
                  <p className="ds-eyebrow">Current party</p>
                  {candidate.logo ? (
                    <img
                      alt={`${partyName} logo`}
                      className="candidate-profile__party-logo"
                      src={candidate.logo}
                    />
                  ) : null}
                  <div className="candidate-profile__party-name">
                    <span>{partyName}</span>
                  </div>
                </div>
              </div>
            </div>

          </section>

          <section className="candidate-profile__trust-card">
            <ul className="candidate-profile__trust-list" aria-label="Profile verification standards">
              <li>Public sources only</li>
              <li>Citations on every profile</li>
              <li>Corrections published in full</li>
            </ul>
            <Link
              className="ds-button ds-button--primary candidate-profile__action"
              href={`/report?candidate=${encodeURIComponent(candidate.id)}`}
            >
              Request a correction
            </Link>
          </section>

        </div>

        <div className="candidate-profile__main">
          <section className="candidate-profile__section">
            <div className="candidate-profile__section-heading">
              <h2>Education</h2>
            </div>
            <div className="candidate-profile__empty">
              <p>This section is not available yet for this candidate.</p>
              <p>If you have a credible public source, you can help improve this profile.</p>
            </div>
          </section>

          <section className="candidate-profile__section">
            <div className="candidate-profile__section-heading">
              <h2>Experience</h2>
            </div>
            <div className="candidate-profile__empty">
              <p>Public background information will appear here when available.</p>
              <p>You can suggest updates with a public link.</p>
            </div>
          </section>

          <section className="candidate-profile__section">
            <div className="candidate-profile__section-heading">
              <h2>Manifesto</h2>
            </div>
            <div className="candidate-profile__empty">
              <p>We summarize policies using public sources and official statements.</p>
              <p>No manifesto content has been added yet for this candidate.</p>
            </div>
          </section>

          <section className="candidate-profile__section" id="candidate-sources">
            <div className="candidate-profile__section-heading">
              <h2>Sources</h2>
            </div>
            <p className="candidate-profile__aside-copy">
              Use sources to verify this listing. We link only to public pages.
            </p>

            {sources.length > 0 ? (
              <ul className="candidate-profile__sources">
                {sources.map((source, index) => (
                  <li className="candidate-profile__source" key={`${source}-${index}`}>
                    <span className="candidate-profile__source-index">{index + 1}</span>
                    <div>
                      <p>{getSourceHost(source)}</p>
                      <a href={source} rel="noopener noreferrer" target="_blank">
                        {source}
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="candidate-profile__empty candidate-profile__empty--small">
                <p>No public source has been attached to this profile yet.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </article>
  );
}

type Props = {
  candidates?: Candidate[];
  candidateId?: string;
  initialFilters?: {
    lga?: string;
    party?: string;
    position?: string;
    query?: string;
    state?: string;
  };
};

export function CandidatePage({
  candidates = [],
  candidateId,
  initialFilters,
}: Props) {
  const [searchQuery, setSearchQuery] = useState(initialFilters?.query || "");
  const [selectedParty, setSelectedParty] = useState(initialFilters?.party || "");
  const [selectedPosition, setSelectedPosition] = useState(
    initialFilters?.position || "",
  );
  const [selectedStateId, setSelectedStateId] = useState(initialFilters?.state || "");
  const [selectedLga, setSelectedLga] = useState(initialFilters?.lga || "");

  function resetSuggestedFilters() {
    setSelectedParty("");
    setSelectedPosition("");
    setSelectedStateId("");
    setSelectedLga("");
  }

  const suggestedFilters = [
    {
      label: "Presidential",
      isActive: selectedPosition === "president",
      onClick: () => {
        resetSuggestedFilters();
        setSelectedPosition("president");
      },
    },
    {
      label: "Governorship",
      isActive: selectedPosition === "governor",
      onClick: () => {
        resetSuggestedFilters();
        setSelectedPosition("governor");
      },
    },
    {
      label: "Senate",
      isActive: selectedPosition === "senator",
      onClick: () => {
        resetSuggestedFilters();
        setSelectedPosition("senator");
      },
    },
    {
      label: "House of Reps",
      isActive: selectedPosition === "house-of-reps",
      onClick: () => {
        resetSuggestedFilters();
        setSelectedPosition("house-of-reps");
      },
    },
    {
      label: "NDC",
      isActive: selectedParty === "ndc",
      onClick: () => {
        resetSuggestedFilters();
        setSelectedParty("ndc");
      },
    },
    {
      label: "Abuja",
      isActive: selectedStateId === "fct",
      onClick: () => {
        resetSuggestedFilters();
        setSelectedStateId("fct");
      },
    },
  ];

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
      <SiteHeader />

      <main
        id="main-content"
        style={{
          padding: isListMode ? "3rem 1rem" : "1.75rem 1rem 3rem",
          minHeight: "60vh",
        }}
      >
        <div
          style={{
            maxWidth: "var(--ds-frame)",
            margin: "0 auto",
          }}
        >
          {isListMode ? (
            <PageBreadcrumb
              items={[
                { href: "/", label: "Home" },
                { label: "Candidates" },
              ]}
            />
          ) : null}

          {isListMode ? (
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
                <div className="candidates-filter-toprow">
                  <div className="search-filter__field candidates-filter-toprow__search">
                    <label
                      className="ds-eyebrow search-filter__label"
                      htmlFor="filter-query"
                    >
                      <span className="ds-desktop-only">Name or party</span>
                      <span className="ds-mobile-only">Name/Party</span>
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
                        placeholder="Search"
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div
                    className="candidates-filter-toprow__suggestions"
                    aria-label="Suggested filters"
                  >
                    <p className="ds-eyebrow ds-eyebrow--accent candidates-filter-toprow__label">
                      Suggested filters
                    </p>
                    <div className="candidates-filter-toprow__chips">
                      {suggestedFilters.map((filter) => (
                        <button
                          key={filter.label}
                          type="button"
                          className={`candidates-filter-toprow__chip${
                            filter.isActive
                              ? " candidates-filter-toprow__chip--active"
                              : ""
                          }`}
                          onClick={filter.onClick}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
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
                        listLabel: formatPositionName(position),
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
                          : "Select a state"
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
                  <Link
                    className="ds-button ds-button--primary"
                    href="/submit-candidate"
                    style={{ margin: "1rem auto 0", cursor: "pointer", display: "inline-block" }}
                  >
                    Submit a Candidate
                  </Link>
                </div>
              )}
            </div>
          ) : candidate ? (
            <CandidateProfile candidate={candidate} />
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

      <SiteFooter />
    </>
  );
}
