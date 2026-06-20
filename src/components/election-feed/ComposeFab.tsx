"use client";

type Props = {
  onClick: () => void;
};

export function ComposeFab({ onClick }: Props) {
  return (
    <button
      type="button"
      className="election-feed__fab election-feed__fab--compose"
      onClick={onClick}
      aria-label="Post a polling-unit update"
      aria-haspopup="dialog"
      data-testid="election-feed-compose-fab"
    >
      <svg
        className="election-feed__fab-compose-glyph"
        viewBox="0 0 24 24"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <line x1="12" y1="4" x2="12" y2="20" />
        <line x1="4" y1="12" x2="20" y2="12" />
      </svg>
    </button>
  );
}
