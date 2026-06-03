import type { Candidate, Fact } from "../types/domain";

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

  return (
    <article className={`ds-evidence-card ds-evidence-card--tilt-${tilt}`}>
      <div className="ds-evidence-card__noise" aria-hidden="true" />
      <div className="ds-evidence-card__content">
          <header className="ds-evidence-card__header">
            <div>
              <div className="ds-evidence-card__meta-label">
                {isCandidate ? "Party" : "Topic"}
              </div>
              <div className="ds-evidence-card__number">
                {isCandidate ? candidate.party : fact.category}
              </div>
            </div>
            <div className="ds-evidence-card__status">
              <div className="ds-evidence-card__meta-label">
                {isCandidate ? "Office" : "Source"}
              </div>
              <div className="ds-evidence-card__status-value">
                {isCandidate ? candidate.position : fact.source}
              </div>
            </div>
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
                <a href={detailsUrl} className="ds-evidence-card__inline-link">
                  {isCandidate
                    ? candidate.stateName || candidate.state
                    : "Will of the People"}
                </a>
              </cite>
            </p>
            <div className="ds-evidence-card__brand">
              <a href={detailsUrl} className="ds-evidence-card__inline-link">
                willofthepeople.ng
              </a>
            </div>
          </footer>
        </div>
      </article>
  );
}
