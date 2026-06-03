import type { Candidate } from "../types/domain";
import { CandidateCard } from "./CandidateCard";
import { ComponentErrorBoundary } from "./ComponentErrorBoundary";

type Props = {
  candidate: Candidate;
  onNavigate?: (path: string) => void;
  variant?: "default" | "home";
};

function CandidateCardFallback() {
  return (
    <li className="ds-candidate-card" style={{ borderColor: "rgba(167, 29, 42, 0.35)" }}>
      <p className="ds-eyebrow" style={{ color: "#a71d2a", marginBottom: "0.5rem" }}>
        Candidate Unavailable
      </p>
      <p style={{ margin: 0, color: "var(--ds-color-ink-soft)" }}>
        We hit an issue rendering this profile. Try again shortly.
      </p>
    </li>
  );
}

export function SafeCandidateCard({ candidate, onNavigate, variant = "default" }: Props) {
  return (
    <ComponentErrorBoundary fallback={<CandidateCardFallback />}>
      <CandidateCard candidate={candidate} onNavigate={onNavigate} variant={variant} />
    </ComponentErrorBoundary>
  );
}
