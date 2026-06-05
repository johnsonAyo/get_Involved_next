import type { Candidate, Fact } from "../types/domain";
import { formatPositionName } from "../utils/formatters";

type Props = {
  item: Candidate | Fact;
  tilt?: "left" | "right";
  variant?: "candidate" | "fact";
};

export function EvidenceCard({ item, tilt = "left", variant = "fact" }: Props) {
  const isCandidate = variant === "candidate";
  const candidate = item as Candidate;
  const fact = item as Fact;
  const detailsUrl = isCandidate ? `/candidates/${item.id}` : `/facts/${item.id}`;
  const candidateLinkUrl = isCandidate ? candidate.profileUrl || detailsUrl : detailsUrl;
  const isExternalProfileLink = Boolean(isCandidate && candidate.profileUrl);
  const sources = candidate.source;

  return (
    <article className={`ds-evidence-card ds-evidence-card--tilt-${tilt}`}>
      <div className="ds-evidence-card__noise" aria-hidden="true" />
      <div className="ds-evidence-card__content">
        <header className="ds-evidence-card__header">
          <div>
            {isCandidate && (
              <div className="ds-evidence-card__meta-label">
                Party
              </div>
            )}
            <div className="ds-evidence-card__number">
              {isCandidate ? candidate.party : fact.category}
            </div>
          </div>
          {isCandidate && (
            <div className="ds-evidence-card__status">
              <div className="ds-evidence-card__meta-label">
                Office
              </div>
              <div className="ds-evidence-card__status-value">
                {formatPositionName(candidate.position)}
              </div>
            </div>
          )}
        </header>
        <div className="ds-evidence-card__divider" aria-hidden="true" />
        <div className="ds-evidence-card__body">
          <p className="ds-evidence-card__lede">
            {isCandidate ? (
              <a
                href={candidateLinkUrl}
                className="ds-evidence-card__inline-link"
                rel={isExternalProfileLink ? "noopener noreferrer" : undefined}
                target={isExternalProfileLink ? "_blank" : undefined}
              >
                {candidate.candidateName}
              </a>
            ) : (
              fact.text
            )}
          </p>
          {isCandidate && candidate.viceCandidateName && (
            <p className="ds-meta" style={{ marginTop: "0.5rem", opacity: 0.8 }}>
              Running Mate:{" "}
              <a href={detailsUrl} className="ds-evidence-card__inline-link">
                {candidate.viceCandidateName}
              </a>
            </p>
          )}
        </div>
        <div className="ds-evidence-card__divider" aria-hidden="true" />
        <footer className="ds-evidence-card__footer">
          <p className="ds-evidence-card__citation">
            <span aria-hidden="true">—</span>
            <cite>
              {isCandidate ? (
                Array.isArray(sources) ? (
                  sources.map((src, idx) => (
                    <a
                      key={idx}
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ds-evidence-card__inline-link"
                      style={{ marginRight: "0.5rem" }}
                    >
                      Source{sources.length > 1 ? ` ${idx + 1}` : ""}
                    </a>
                  ))
                ) : sources ? (
                  <a
                    href={sources}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ds-evidence-card__inline-link"
                  >
                    Source
                  </a>
                ) : (
                  candidate.stateName || candidate.state || "Will of the People"
                )
              ) : (
                fact.source
              )}
            </cite>
          </p>
        </footer>
      </div>
    </article>
  );
}
