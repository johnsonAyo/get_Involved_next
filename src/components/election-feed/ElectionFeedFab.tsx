"use client";

type Props = {
  onClick: () => void;
};

export function ElectionFeedFab({ onClick }: Props) {
  return (
    <button
      type="button"
      className="election-feed__fab"
      onClick={onClick}
      aria-label="Open election feed"
      aria-haspopup="dialog"
    >
      <span className="election-feed__fab-dot" aria-hidden="true" />
      <span className="election-feed__fab-label">Election Feed</span>
      <span className="election-feed__fab-live" aria-hidden="true">
        · live
      </span>
    </button>
  );
}
