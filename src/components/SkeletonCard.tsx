/**
 * Skeleton loading components used by per-route loading.tsx files.
 * Matches the layout of the real components to reduce layout shift.
 */

function pulseStyle(): React.CSSProperties {
  return {
    background: "var(--ds-color-ink-a10)",
    borderRadius: "4px",
    animation: "skeletonPulse 1.5s ease-in-out infinite",
  };
}

/** A single candidate card skeleton matching the grid card layout */
export function SkeletonCandidateCard() {
  return (
    <li
      className="ds-candidate-card"
      style={{ minHeight: "16rem", pointerEvents: "none" }}
      aria-hidden="true"
    >
      {/* Party abbreviation */}
      <div style={{ ...pulseStyle(), width: "6rem", height: "2rem" }} />
      {/* Position badge */}
      <div style={{ ...pulseStyle(), width: "8rem", height: "1.25rem" }} />
      {/* Candidate name */}
      <div style={{ ...pulseStyle(), width: "85%", height: "1.4rem", marginTop: "0.5rem" }} />
      {/* State / LGA */}
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
        <div style={{ ...pulseStyle(), width: "6rem", height: "1.25rem" }} />
        <div style={{ ...pulseStyle(), width: "5rem", height: "1.25rem" }} />
      </div>
    </li>
  );
}

/** Grid of candidate card skeletons for directory pages */
export function SkeletonCandidateGrid({ count = 12 }: { count?: number }) {
  return (
    <ul
      className="recent__grid"
      style={{ listStyle: "none", padding: 0, margin: 0 }}
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCandidateCard key={i} />
      ))}
    </ul>
  );
}

/** Skeleton for the state list (desktop split-pane) */
export function SkeletonStateList() {
  // Fixed widths to avoid hydration mismatches between server and client
  const widths = [72, 58, 85, 63, 77, 90, 55, 68, 82, 60, 74, 88];

  return (
    <div aria-hidden="true">
      {widths.map((width, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "0.75rem 1rem",
            marginBottom: "0.25rem",
          }}
        >
          <div style={{ ...pulseStyle(), width: `${width}%`, height: "1rem" }} />
          <div style={{ ...pulseStyle(), width: "3rem", height: "1rem" }} />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for the form page layout */
export function SkeletonFormPage() {
  return (
    <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ ...pulseStyle(), width: "16rem", height: "2.5rem" }} />
      <div style={{ ...pulseStyle(), width: "100%", height: "3.5rem" }} />
      <div style={{ ...pulseStyle(), width: "100%", height: "3.5rem" }} />
      <div style={{ ...pulseStyle(), width: "100%", height: "3.5rem" }} />
      <div style={{ ...pulseStyle(), width: "12rem", height: "3.5rem", marginTop: "1rem" }} />
    </div>
  );
}

/** Skeleton for a single candidate detail page */
export function SkeletonCandidateDetail() {
  return (
    <ul
      className="recent__grid"
      style={{ listStyle: "none", padding: 0, margin: 0 }}
      aria-hidden="true"
    >
      <SkeletonCandidateCard />
    </ul>
  );
}
