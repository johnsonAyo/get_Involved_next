import { Wordmark } from "./Wordmark";

type Props = {
  onNavigate?: (path: string) => void;
};

export function SiteHeader({ onNavigate }: Props) {
  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!onNavigate) return;
    e.preventDefault();
    onNavigate("/");
  };

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a
          aria-label="Will of the People home"
          href="/"
          onClick={handleHomeClick}
        >
          <Wordmark className="ds-wordmark--header" />
        </a>
        <nav className="site-header__nav" aria-label="Primary">
          <ul className="site-header__nav-list">
            <li>
              <a
                href="/search"
                onClick={(e) => {
                  if (!onNavigate) return;
                  e.preventDefault();
                  onNavigate("/search");
                }}
              >
                Search
              </a>
            </li>
            <li className="site-header__nav-item">
              <a
                href="/states"
                onClick={(e) => {
                  if (!onNavigate) return;
                  e.preventDefault();
                  onNavigate("/states");
                }}
              >
                States
              </a>
            </li>
            <li className="site-header__nav-item">
              <a
                href="/candidates"
                onClick={(e) => {
                  if (!onNavigate) return;
                  e.preventDefault();
                  onNavigate("/candidates");
                }}
              >
                Candidates
              </a>
            </li>
            <li className="site-header__nav-submit">
              <a
                href="/submit-candidate"
                className="ds-button ds-button--primary"
                style={{
                  minHeight: "auto",
                  padding: "0.5rem 1rem",
                  fontSize: "0.85rem",
                  background: "var(--ds-color-accent)",
                  borderColor: "var(--ds-color-accent)",
                  color: "var(--ds-color-accent-ink)",
                  width: "fit-content",
                }}
                onClick={(e) => {
                  if (!onNavigate) return;
                  e.preventDefault();
                  onNavigate("/submit-candidate");
                }}
              >
                Submit a Candidate
              </a>
            </li>
            <li className="site-header__nav-about">
              <a
                href="/about"
                onClick={(e) => {
                  if (!onNavigate) return;
                  e.preventDefault();
                  onNavigate("/about");
                }}
              >
                About
              </a>
            </li>
            <li className="site-header__nav-report">
              <a
                href="/report"
                onClick={(e) => {
                  if (!onNavigate) return;
                  e.preventDefault();
                  onNavigate("/report");
                }}
              >
                Report an Issue
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
