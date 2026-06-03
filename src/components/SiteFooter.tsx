import { Wordmark } from "./Wordmark";

type Props = {
  onNavigate?: (path: string) => void;
};

export function SiteFooter({ onNavigate }: Props) {
  return (
    <footer className="ds-panel ds-panel--ink site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Wordmark className="ds-wordmark--footer" />
          <p className="site-footer__tagline">
            Search candidates. Filter by state and local government. Know who is
            on your ballot.
          </p>
        </div>
        <nav className="site-footer__nav" aria-label="Footer">
          <ul>
            <li>
              <a
                href="/about"
                onClick={(e) => {
                  if (onNavigate) {
                    e.preventDefault();
                    onNavigate("/about");
                  }
                }}
              >
                About
              </a>
            </li>
            <li>
              <a
                href="/states"
                onClick={(e) => {
                  if (onNavigate) {
                    e.preventDefault();
                    onNavigate("/states");
                  }
                }}
              >
                All 36 states
              </a>
            </li>
            <li>
              <a
                href="/candidates"
                onClick={(e) => {
                  if (onNavigate) {
                    e.preventDefault();
                    onNavigate("/candidates");
                  }
                }}
              >
                Candidates
              </a>
            </li>
            <li>
              <a
                href="/report"
                onClick={(e) => {
                  if (onNavigate) {
                    e.preventDefault();
                    onNavigate("/report");
                  }
                }}
              >
                Corrections
              </a>
            </li>
            <li>
              <a
                href="/report"
                onClick={(e) => {
                  if (onNavigate) {
                    e.preventDefault();
                    onNavigate("/report");
                  }
                }}
              >
                Report an issue
              </a>
            </li>
          </ul>
        </nav>
        <div className="site-footer__reply">
          <p className="ds-eyebrow ds-eyebrow--accent">Submit a candidate</p>
          <p>
            If you have any aspirant or candidate not on this profile,{" "}
            <a
              href="/submit-candidate"
              onClick={(e) => {
                if (onNavigate) {
                  e.preventDefault();
                  onNavigate("/submit-candidate");
                }
              }}
              style={{ color: "var(--ds-color-accent)", fontWeight: "bold" }}
            >
              submit their profile here
            </a>
            .
          </p>
        </div>
        <div className="ds-meta site-footer__colophon">
          <p>© Will of the People · Federal Republic of Nigeria</p>
          <p>
            Updated <time dateTime="2026-05-30">30 May 2026</time>
          </p>
        </div>
      </div>
    </footer>
  );
}
