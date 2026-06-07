"use client";
import { useState, useEffect, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { stateNames, getLgas } from "@/data/nigeria.js";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { DropdownSelect } from "@/components/DropdownSelect";
import { NigeriaStatesMap } from "@/components/NigeriaStatesMap";
import Link from "next/link";
import type { Candidate } from "@/types/domain";
import { formatPositionName } from "@/utils/formatters";

function isGovernorshipPosition(position?: string): boolean {
  const normalized = position?.toLowerCase() || "";
  return normalized === "governor" || normalized === "governorship";
}

function getPositionSortOrder(position?: string): number {
  if (isGovernorshipPosition(position)) return 0;

  const normalized = position?.toLowerCase() || "";
  if (normalized === "deputy-governor" || normalized === "deputy governor") return 1;
  if (normalized === "senator") return 2;
  if (normalized === "house-of-reps" || normalized === "house of representatives") return 3;
  if (normalized === "state-house-of-assembly" || normalized === "state house of assembly") return 4;
  return 10;
}

function sortCandidates(candidates: Candidate[]): Candidate[] {
  return [...candidates].sort((a, b) => {
    const positionOrder = getPositionSortOrder(a.position) - getPositionSortOrder(b.position);
    if (positionOrder !== 0) return positionOrder;

    return (a.candidateName || "").localeCompare(b.candidateName || "");
  });
}

function getStateCandidates(candidates: Candidate[], stateId: string): Candidate[] {
  return sortCandidates(
    candidates.filter((candidate) => candidate.stateId?.toLowerCase() === stateId.toLowerCase()),
  );
}

function filterStateCandidates(
  candidates: Candidate[],
  filters: { lga: string; party: string; position: string },
): Candidate[] {
  return sortCandidates(
    candidates.filter((candidate) => {
      const matchesLga = !filters.lga || candidate.lga?.toLowerCase() === filters.lga.toLowerCase();
      const matchesParty = !filters.party || candidate.partyId === filters.party;
      const matchesPosition = !filters.position || candidate.position === filters.position;

      return matchesLga && matchesParty && matchesPosition;
    }),
  );
}

function getPartyOptions(candidates: Candidate[]) {
  return Array.from(
    new Map(
      candidates
        .filter((candidate) => candidate.partyId && candidate.party)
        .map((candidate) => [
          candidate.partyId!,
          {
            listLabel: candidate.partyFullName
              ? `${candidate.partyFullName} (${candidate.party})`
              : candidate.party,
            value: candidate.partyId!,
          },
        ]),
    ).values(),
  ).sort((a, b) => a.listLabel.localeCompare(b.listLabel));
}

function getPositionOptions(candidates: Candidate[]) {
  return Array.from(new Set(candidates.map((candidate) => candidate.position).filter(Boolean)))
    .sort((a, b) => getPositionSortOrder(a) - getPositionSortOrder(b) || formatPositionName(a).localeCompare(formatPositionName(b)))
    .map((position) => ({
      listLabel: formatPositionName(position),
      value: position,
    }));
}

/* ─── Shared candidate card (used in both views) ──────────────────────────── */
function CandidateListItem({ candidate }: { candidate: Candidate }) {
  const logoSrc = candidate.logo;
  const profilePictureSrc = candidate.profilePictureUrl;

  return (
    <Link
      href={`/candidates/${candidate.id}`}
      className="candidate-list-item-link"
      style={{
        padding: "1rem",
        border: "1px solid var(--ds-color-ink-a10)",
        background: "var(--ds-color-paper)",
        borderRadius: "4px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer",
      }}
    >
      <div>
        <strong style={{ display: "block", fontSize: "0.95rem", color: "var(--ds-color-ink)" }}>{candidate.candidateName}</strong>
        <span style={{ fontSize: "0.75rem", color: "var(--ds-color-ink-muted)" }}>
          {formatPositionName(candidate.position)} {candidate.lga ? `· ${candidate.lga}` : ""}
        </span>
      </div>
      {profilePictureSrc ? (
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexShrink: 0 }}>
          <img
            src={profilePictureSrc}
            alt={`${candidate.candidateName} profile picture`}
            style={{ width: "2.75rem", height: "2.75rem", objectFit: "cover", objectPosition: "center top", borderRadius: "999px" }}
          />
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={`${candidate.party} logo`}
              style={{ width: candidate.partyId === "ndc" ? "3.25rem" : "2.25rem", height: candidate.partyId === "ndc" ? "3.25rem" : "2.25rem", objectFit: "contain", borderRadius: "4px" }}
            />
          ) : null}
        </div>
      ) : logoSrc ? (
        <img
          src={logoSrc}
          alt={`${candidate.party} logo`}
          style={{ width: candidate.partyId === "ndc" ? "3.5rem" : "2.5rem", height: candidate.partyId === "ndc" ? "3.5rem" : "2.5rem", objectFit: "contain", borderRadius: "4px" }}
        />
      ) : (
        <span
          style={{
            fontSize: "0.75rem",
            fontFamily: "var(--ds-font-mono)",
            fontWeight: 700,
            background: "rgba(0,135,83,0.08)",
            padding: "0.2rem 0.5rem",
            borderRadius: "3px",
            color: "var(--ds-color-accent)",
          }}
        >
          {candidate.party}
        </span>
      )}
    </Link>
  );
}

/* ─── Mobile accordion body (detail panel shown inline) ───────────────────── */
type StateRecord = {
  id: string;
  capital: string;
  lgaCount: number;
  zone: string;
  name: string;
  slogan: string;
  population?: number;
};

type AccordionBodyProps = {
  stateObj: StateRecord;
  lgas: string[];
  selectedLga: string;
  selectedParty: string;
  selectedPosition: string;
  onLgaChange: (localGovernment: string) => void;
  onPartyChange: (party: string) => void;
  onPositionChange: (position: string) => void;
  allCandidates: Candidate[];
  candidates: Candidate[];
  onSelectState: (stateId: string) => void;
};

function AccordionBody({
  stateObj,
  lgas,
  selectedLga,
  selectedParty,
  selectedPosition,
  onLgaChange,
  onPartyChange,
  onPositionChange,
  allCandidates,
  candidates,
  onSelectState,
}: AccordionBodyProps) {
  const partyOptions = getPartyOptions(allCandidates);
  const positionOptions = getPositionOptions(allCandidates);

  return (
    <div className="states-accordion__body">
      {/* Interactive Map on Mobile */}
      <div
        style={{
          minWidth: 0,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          marginBottom: "1.25rem",
          background: "var(--ds-color-paper)",
          border: "1px solid var(--ds-color-ink-a10)",
          padding: "1rem",
          borderRadius: "6px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "320px" }}>
          <NigeriaStatesMap
            activeStateId={stateObj.id}
            className="states-directory__map-svg"
            onSelectState={onSelectState}
          />
        </div>
      </div>

      {/* Pills */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <span
          style={{
            fontFamily: "var(--ds-font-mono)",
            fontSize: "0.7rem",
            fontWeight: 700,
            color: "var(--ds-color-accent)",
            border: "1px solid var(--ds-color-accent)",
            padding: "0.2rem 0.5rem",
            borderRadius: "4px",
            background: "rgba(0, 135, 83, 0.04)",
          }}
        >
          {stateObj.lgaCount} LGAs
        </span>
        <span
          style={{
            fontFamily: "var(--ds-font-mono)",
            fontSize: "0.7rem",
            fontWeight: 700,
            color: "var(--ds-color-accent)",
            border: "1px solid var(--ds-color-accent)",
            padding: "0.2rem 0.5rem",
            borderRadius: "4px",
            background: "rgba(0, 135, 83, 0.04)",
          }}
        >
          {candidates.length} Listed Candidate{candidates.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Capital and Zone info box */}
      <div className="states-accordion__info-box" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <span className="states-accordion__info-label">STATE CAPITAL</span>
          <strong className="states-accordion__info-value">{stateObj.capital}</strong>
        </div>
        <div>
          <span className="states-accordion__info-label">GEOPOLITICAL ZONE</span>
          <strong className="states-accordion__info-value">{stateObj.zone}</strong>
        </div>
      </div>

      {/* Filters */}
      <div className="states-accordion__filters">
        <div className="states-accordion__filter">
          <label
            htmlFor={`mob-lga-${stateObj.id}`}
            className="states-accordion__filter-label"
          >
            Local Government
          </label>
          <DropdownSelect
            id={`mob-lga-${stateObj.id}`}
            onChange={onLgaChange}
            options={lgas.map((localGovernment) => ({
              listLabel: localGovernment,
              value: localGovernment,
            }))}
            placeholder="All LGAs"
            value={selectedLga}
            variant="compact"
          />
        </div>
        <div className="states-accordion__filter">
          <label
            htmlFor={`mob-party-${stateObj.id}`}
            className="states-accordion__filter-label"
          >
            Party
          </label>
          <DropdownSelect
            id={`mob-party-${stateObj.id}`}
            onChange={onPartyChange}
            options={partyOptions}
            placeholder="All parties"
            value={selectedParty}
            variant="compact"
          />
        </div>
        <div className="states-accordion__filter">
          <label
            htmlFor={`mob-position-${stateObj.id}`}
            className="states-accordion__filter-label"
          >
            Position
          </label>
          <DropdownSelect
            id={`mob-position-${stateObj.id}`}
            onChange={onPositionChange}
            options={positionOptions}
            placeholder="All positions"
            value={selectedPosition}
            variant="compact"
          />
        </div>
      </div>

      {/* Candidates */}
      <h4 className="states-accordion__candidates-title">
        Candidates ({candidates.length})
      </h4>
      {candidates.length > 0 ? (
        <div className="states-accordion__candidates-list">
          {candidates.map((candidate) => (
            <CandidateListItem key={candidate.id} candidate={candidate} />
          ))}
        </div>
      ) : (
        <p className="states-accordion__empty">No candidates registered for this state/LGA yet.</p>
      )}

      <Link
        href="/submit-candidate"
        className="ds-button ds-button--primary states-accordion__cta"
        style={{ display: "inline-block", textAlign: "center" }}
      >
        Add Candidate →
      </Link>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export function StatesPage({
  candidates = [],
  initialLga = "",
  initialParty = "",
  initialPosition = "",
  initialStateId = "abia",
}: {
  candidates?: Candidate[];
  initialLga?: string;
  initialParty?: string;
  initialPosition?: string;
  initialStateId?: string;
}) {
  const router = useRouter();
  const [selectedStateId, setSelectedStateId] = useState(initialStateId);
  const [selectedLga, setSelectedLga] = useState(initialLga);
  const [selectedParty, setSelectedParty] = useState(initialParty);
  const [selectedPosition, setSelectedPosition] = useState(initialPosition);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedStateId) params.set("state", selectedStateId);
    if (selectedLga) params.set("lga", selectedLga);
    if (selectedParty) params.set("party", selectedParty);
    if (selectedPosition) params.set("position", selectedPosition);

    const newQueryStr = params.toString();
    const newPath = newQueryStr ? `/states?${newQueryStr}` : "/states";

    if (window.location.search !== (newQueryStr ? `?${newQueryStr}` : "")) {
      router.replace(newPath, { scroll: false });
    }
  }, [selectedStateId, selectedLga, selectedParty, selectedPosition, router]);

  useLayoutEffect(() => {
    if (selectedStateId && typeof window !== "undefined") {
      if (window.innerWidth <= 1024) {
        const element = document.getElementById(`state-card-${selectedStateId}`);
        if (element) {
          element.scrollIntoView({ behavior: "auto", block: "start" });
        }
      } else {
        const element = document.getElementById("desktop-detail-column");
        if (element) {
          element.scrollTop = 0;
        }
      }
    }
  }, [selectedStateId]);

  const handleStateClick = (stateId: string) => {
    setSelectedStateId(stateId);
    setSelectedLga("");
    setSelectedParty("");
    setSelectedPosition("");
  };

  const lgas = selectedStateId ? getLgas(selectedStateId) : [];

  const selectedStateAllCandidates = getStateCandidates(candidates, selectedStateId);
  const selectedStateCandidates = filterStateCandidates(selectedStateAllCandidates, {
    lga: selectedLga,
    party: selectedParty,
    position: selectedPosition,
  });
  const selectedStatePartyOptions = getPartyOptions(selectedStateAllCandidates);
  const selectedStatePositionOptions = getPositionOptions(selectedStateAllCandidates);
  const selectedStateObj = stateNames.find((s) => s.id === selectedStateId);

  return (
    <>
      <SiteHeader />

      <main
        className="submit-page"
        id="main-content"
        style={{
          borderTop: "var(--ds-rule-accent) solid var(--ds-color-ink)",
          paddingBottom: "5rem",
        }}
      >
        <div
          className="submit-page__inner states-page__inner"
          style={{ maxWidth: "var(--ds-frame)" }}
        >
          <PageBreadcrumb
            items={[
              { href: "/", label: "Home" },
              { label: "States" },
            ]}
          />
          <header className="submit-page__intro" style={{ marginBottom: "2rem" }}>
            <h1 className="ds-page-title" style={{ margin: "0.5rem 0" }}>
              Nigerian States &amp; Candidates
            </h1>
          </header>

          {/* ══ DESKTOP: two-column split-screen (untouched) ══════════════ */}
          <div
            className="states-desktop-only"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.5fr",
              gap: "2rem",
              border: "var(--ds-rule-thin) solid var(--ds-color-ink)",
              minHeight: "calc(100vh - 18rem)",
              height: "clamp(33rem, 60vh, 42rem)",
              background: "var(--ds-color-surface)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
            }}
          >
            {/* Left States List Column */}
            <div
              style={{
                borderRight: "var(--ds-rule-thin) solid var(--ds-color-ink-a10)",
                overflowY: "auto",
                padding: "1rem",
              }}
            >
              {stateNames.map((state) => {
                const isActive = state.id === selectedStateId;
                return (
                  <div
                    key={state.id}
                    onClick={() => setSelectedStateId(state.id)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.75rem 1rem",
                      marginBottom: "0.25rem",
                      borderRadius: "4px",
                      cursor: "pointer",
                      background: isActive ? "var(--ds-color-accent)" : "transparent",
                      color: isActive ? "var(--ds-color-accent-ink)" : "var(--ds-color-ink)",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = "rgba(0, 135, 83, 0.05)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <span style={{ fontWeight: isActive ? 700 : 500, fontSize: "0.95rem" }}>{state.name}</span>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: isActive ? "rgba(255, 255, 255, 0.8)" : "var(--ds-color-ink-muted)",
                        }}
                      >
                        {state.zone}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontFamily: "var(--ds-font-mono)",
                        opacity: 0.8,
                        background: isActive ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.05)",
                        padding: "0.15rem 0.35rem",
                        borderRadius: "3px",
                      }}
                    >
                      {state.lgaCount} LGAs
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Right Detail Panel Column */}
            <div
              id="desktop-detail-column"
              style={{
                padding: "2.5rem 2rem",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {selectedStateObj ? (
                <div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.1fr 1fr",
                      gap: "1.5rem",
                      marginBottom: "2rem",
                      background: "var(--ds-color-paper)",
                      border: "1px solid var(--ds-color-ink-a10)",
                      padding: "1.5rem",
                      borderRadius: "6px",
                      alignItems: "center",
                    }}
                  >
                    {/* Left: Interactive Map */}
                    <div
                      style={{
                        minWidth: 0,
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <NigeriaStatesMap
                        activeStateId={selectedStateId}
                        className="states-directory__map-svg"
                        onSelectState={(stateId) => {
                          setSelectedStateId(stateId);
                          setSelectedLga("");
                        }}
                      />
                    </div>

                    {/* Right: State Details */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div>
                        <h3
                          style={{
                            fontFamily: "var(--ds-font-display)",
                            fontSize: "2rem",
                            fontWeight: 800,
                            margin: 0,
                            letterSpacing: "-0.03em",
                            lineHeight: 1.1,
                          }}
                        >
                          {selectedStateObj.name}
                        </h3>
                        {selectedStateObj.slogan && (
                          <p
                            style={{
                              color: "var(--ds-color-ink-muted)",
                              fontSize: "0.85rem",
                              margin: "0.2rem 0 0 0",
                              fontStyle: "italic",
                            }}
                          >
                            "{selectedStateObj.slogan}"
                          </p>
                        )}
                      </div>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        <span
                          style={{
                            fontFamily: "var(--ds-font-mono)",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "var(--ds-color-accent)",
                            border: "1px solid var(--ds-color-accent)",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "4px",
                            background: "rgba(0, 135, 83, 0.04)",
                          }}
                        >
                          {selectedStateObj.lgaCount} LGAs
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--ds-font-mono)",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "var(--ds-color-accent)",
                            border: "1px solid var(--ds-color-accent)",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "4px",
                            background: "rgba(0, 135, 83, 0.04)",
                          }}
                        >
                          {selectedStateCandidates.length} Listed Candidate{selectedStateCandidates.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "0.75rem",
                          borderTop: "1px solid var(--ds-color-ink-a10)",
                          paddingTop: "0.75rem",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              color: "var(--ds-color-ink-muted)",
                              display: "block",
                              fontSize: "0.6rem",
                              fontFamily: "var(--ds-font-mono)",
                              letterSpacing: "0.05em",
                            }}
                          >
                            STATE CAPITAL
                          </span>
                          <strong style={{ color: "var(--ds-color-ink)", fontSize: "1rem" }}>
                            {selectedStateObj.capital}
                          </strong>
                        </div>
                        <div>
                          <span
                            style={{
                              color: "var(--ds-color-ink-muted)",
                              display: "block",
                              fontSize: "0.6rem",
                              fontFamily: "var(--ds-font-mono)",
                              letterSpacing: "0.05em",
                            }}
                          >
                            GEOPOLITICAL ZONE
                          </span>
                          <strong style={{ color: "var(--ds-color-ink)", fontSize: "1rem" }}>
                            {selectedStateObj.zone}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Filters inside details */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "0.75rem", marginBottom: "2rem" }}>
                    <div>
                      <label
                        htmlFor="detail-lga-filter"
                        style={{
                          display: "block",
                          fontFamily: "var(--ds-font-mono)",
                          fontSize: "0.65rem",
                          color: "var(--ds-color-ink-muted)",
                          marginBottom: "0.3rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Local Government
                      </label>
                      <DropdownSelect
                        id="detail-lga-filter"
                        onChange={setSelectedLga}
                        options={lgas.map((localGovernment) => ({
                          listLabel: localGovernment,
                          value: localGovernment,
                        }))}
                        placeholder="All LGAs"
                        value={selectedLga}
                        variant="compact"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="detail-party-filter"
                        style={{
                          display: "block",
                          fontFamily: "var(--ds-font-mono)",
                          fontSize: "0.65rem",
                          color: "var(--ds-color-ink-muted)",
                          marginBottom: "0.3rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Party
                      </label>
                      <DropdownSelect
                        id="detail-party-filter"
                        onChange={setSelectedParty}
                        options={selectedStatePartyOptions}
                        placeholder="All parties"
                        value={selectedParty}
                        variant="compact"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="detail-position-filter"
                        style={{
                          display: "block",
                          fontFamily: "var(--ds-font-mono)",
                          fontSize: "0.65rem",
                          color: "var(--ds-color-ink-muted)",
                          marginBottom: "0.3rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Position
                      </label>
                      <DropdownSelect
                        id="detail-position-filter"
                        onChange={setSelectedPosition}
                        options={selectedStatePositionOptions}
                        placeholder="All positions"
                        value={selectedPosition}
                        variant="compact"
                      />
                    </div>
                  </div>

                  <h4
                    style={{
                      fontFamily: "var(--ds-font-display)",
                      fontSize: "1.2rem",
                      fontWeight: 700,
                      marginBottom: "1rem",
                      borderBottom: "1px solid var(--ds-color-ink-a10)",
                      paddingBottom: "0.5rem",
                    }}
                  >
                    Candidates ({selectedStateCandidates.length})
                  </h4>
                  {selectedStateCandidates.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {selectedStateCandidates.map((candidate) => (
                        <CandidateListItem key={candidate.id} candidate={candidate} />
                      ))}
                    </div>
                  ) : (
                    <p
                      style={{
                        fontStyle: "italic",
                        color: "var(--ds-color-ink-muted)",
                        fontSize: "0.85rem",
                      }}
                    >
                      No candidates registered for this state/LGA yet.
                    </p>
                  )}
                </div>
              ) : (
                <p style={{ color: "var(--ds-color-ink-muted)" }}>
                  Select a state on the left panel.
                </p>
              )}

              <Link
                href="/submit-candidate"
                className="ds-button ds-button--primary"
                style={{ marginTop: "2.5rem", width: "100%", display: "inline-block", textAlign: "center" }}
              >
                Add Candidate →
              </Link>
            </div>
          </div>

          {/* ══ MOBILE: accordion list ═════════════════════════════════════ */}
          <div className="states-mobile-only">
            {stateNames.map((state) => {
              const isOpen = state.id === selectedStateId;
              const allStateCandidates = getStateCandidates(candidates, state.id);
              const stateCandidates = filterStateCandidates(allStateCandidates, {
                lga: selectedLga,
                party: selectedParty,
                position: selectedPosition,
              });
              const stateObj = stateNames.find((s) => s.id === state.id);

              return (
                <div
                  key={state.id}
                  id={`state-card-${state.id}`}
                  className={`states-accordion__item${isOpen ? " states-accordion__item--open" : ""}`}
                >
                  {/* Always-visible trigger row */}
                  <button
                    className="states-accordion__trigger"
                    onClick={() => handleStateClick(state.id)}
                    aria-expanded={isOpen}
                  >
                    <span className="states-accordion__trigger-name">{state.name}</span>
                    <span className="states-accordion__trigger-right">
                      <span className="states-accordion__trigger-count">{state.lgaCount} LGAs</span>
                      <span className="states-accordion__trigger-chevron" aria-hidden="true">
                        {isOpen ? "▲" : "▼"}
                      </span>
                    </span>
                  </button>

                  {/* Detail body — shown only when open */}
                  {isOpen && stateObj && (
                    <AccordionBody
                      stateObj={stateObj}
                      lgas={lgas}
                      selectedLga={selectedLga}
                      selectedParty={selectedParty}
                      selectedPosition={selectedPosition}
                      onLgaChange={setSelectedLga}
                      onPartyChange={setSelectedParty}
                      onPositionChange={setSelectedPosition}
                      allCandidates={allStateCandidates}
                      candidates={stateCandidates}
                      onSelectState={handleStateClick}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
