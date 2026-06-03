import type { Candidate } from "../types/domain";
import { getState } from "../data/nigeria.js";
import Link from "next/link";

type Props = {
  candidate: Candidate;
  variant?: "default" | "home";
};

export function CandidateCard({ candidate, variant = "default" }: Props) {
  const detailsUrl = `/candidates/${candidate.id}`;
  const candidateLinkUrl = candidate.profileUrl || detailsUrl;
  const isExternalProfileLink = Boolean(candidate.profileUrl);

  const logoSrc = candidate.logo;
  const sources = Array.isArray(candidate.source)
    ? candidate.source
    : candidate.source
    ? [candidate.source]
    : [];

  const stateObj = candidate.stateId ? (getState(candidate.stateId.toLowerCase()) as { name: string; lgas: string[] } | undefined) : null;
  const stateName = stateObj ? stateObj.name : (candidate.stateName || candidate.state || "");
  const lgaName = stateObj && candidate.lga
    ? (stateObj.lgas.find((l) => l.toLowerCase() === candidate.lga!.toLowerCase()) || candidate.lga)
    : (candidate.lga || "");

  return (
    <li
      className={`ds-candidate-card${variant === "home" ? " ds-candidate-card--home" : ""}`}
      style={{ position: "relative" }}
    >
      {logoSrc && (
        <img 
          src={logoSrc} 
          alt={`${candidate.party} logo`} 
          className={`ds-candidate-card__logo ${candidate.partyId === "ndc" ? "ds-candidate-card__logo--ndc" : ""}`}
        />
      )}
      <div className="ds-candidate-card__number">{candidate.party}</div>
      <div className="ds-candidate-card__status" style={{ backgroundColor: "rgba(0, 135, 83, 0.08)", color: "var(--ds-color-accent)", borderColor: "rgba(0, 135, 83, 0.2)" }}>{candidate.position}</div>
      <p className="ds-candidate-card__text" style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}>
        {isExternalProfileLink ? (
          <a
            href={candidateLinkUrl}
            className="ds-candidate-card__inline-link"
            rel="noopener noreferrer"
            target="_blank"
          >
            {candidate.candidateName}
          </a>
        ) : (
          <Link href={candidateLinkUrl} className="ds-candidate-card__inline-link">
            {candidate.candidateName}
          </Link>
        )}
        {candidate.viceCandidateName && (
          <span style={{ display: "block", fontSize: "0.85em", opacity: 0.75, marginTop: "0.25rem" }}>
            Running Mate:{" "}
            <Link href={detailsUrl} className="ds-candidate-card__inline-link">
              {candidate.viceCandidateName}
            </Link>
          </span>
        )}
      </p>
      {(stateName || lgaName) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
          {stateName && (
            <Link
              href={`/states?state=${candidate.stateId?.toLowerCase()}`}
              className="ds-candidate-card__status ds-candidate-card__inline-link"
              style={{ textDecoration: "none" }}
            >
              {stateName}
            </Link>
          )}
          {lgaName && (
            <Link
              href={`/states?state=${candidate.stateId?.toLowerCase()}&lga=${encodeURIComponent(lgaName)}`}
              className="ds-candidate-card__status ds-candidate-card__inline-link"
              style={{ textDecoration: "none" }}
            >
              {lgaName}
            </Link>
          )}
        </div>
      )}
      {sources.length > 0 && (
        <p className="ds-candidate-card__source">
          {sources.map((src, idx) => (
            <a
              key={idx}
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="ds-candidate-card__inline-link"
              style={{ marginRight: "0.5rem" }}
            >
              Source{sources.length > 1 ? ` ${idx + 1}` : ""}
            </a>
          ))}
        </p>
      )}
    </li>
  );
}
