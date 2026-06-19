"use client";

import type { Candidate } from "../types/domain";
import type { KeyboardEvent, MouseEvent } from "react";
import { getState } from "../data/nigeria.js";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatPositionName } from "../utils/formatters";

type Props = {
  candidate: Candidate;
  variant?: "default" | "home";
};

export function CandidateCard({ candidate, variant = "default" }: Props) {
  const router = useRouter();
  const detailsUrl = `/candidates/${candidate.id}`;

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
  const isPresidentialCandidate = candidate.position?.toLowerCase() === "president";

  function openProfile() {
    router.push(detailsUrl);
  }

  function handleCardClick(event: MouseEvent<HTMLLIElement>) {
    if ((event.target as HTMLElement).closest("a, button")) return;
    openProfile();
  }

  function handleCardKeyDown(event: KeyboardEvent<HTMLLIElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    if ((event.target as HTMLElement).closest("a, button")) return;
    event.preventDefault();
    openProfile();
  }

  return (
    <li
      className={`ds-candidate-card${variant === "home" ? " ds-candidate-card--home" : ""}${candidate.profilePictureUrl ? " ds-candidate-card--has-bottom-logo" : ""}`}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role="link"
      style={{ position: "relative" }}
      tabIndex={0}
    >
      {candidate.profilePictureUrl && candidate.profilePictureUrl.trim() !== "" && (
        <Image 
          src={candidate.profilePictureUrl} 
          alt={`${candidate.candidateName} profile picture`} 
          className="ds-candidate-card__profile-pic"
          width={80}
          height={80}
        />
      )}
      {logoSrc && logoSrc.trim() !== "" && (
        <Image 
          src={logoSrc} 
          alt={`${candidate.party} logo`} 
          className={`ds-candidate-card__logo ${candidate.profilePictureUrl ? "ds-candidate-card__logo--bottom-right" : ""} ${candidate.partyId === "ndc" ? "ds-candidate-card__logo--ndc" : ""}`}
          width={64}
          height={64}
        />
      )}
      <div className="ds-candidate-card__number">{candidate.party}</div>
      <div className="ds-candidate-card__status" style={{ backgroundColor: "rgba(0, 135, 83, 0.08)", color: "var(--ds-color-accent)", borderColor: "rgba(0, 135, 83, 0.2)" }}>{formatPositionName(candidate.position)}</div>
      <p className="ds-candidate-card__text" style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}>
        <Link href={detailsUrl} className="ds-candidate-card__inline-link">
          {candidate.candidateName}
        </Link>
        {candidate.viceCandidateName && (
          <span style={{ display: "block", fontSize: "0.85em", opacity: 0.75, marginTop: "0.25rem" }}>
            Running Mate:{" "}
            <Link href={detailsUrl} className="ds-candidate-card__inline-link">
              {candidate.viceCandidateName}
            </Link>
          </span>
        )}
      </p>
      {!isPresidentialCandidate && (stateName || lgaName) && (
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
