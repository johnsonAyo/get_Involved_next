import { Wordmark } from "./Wordmark";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link aria-label="Will of the People home" href="/">
          <Wordmark className="ds-wordmark--header" />
        </Link>
        <nav className="site-header__nav" aria-label="Primary">
          <ul className="site-header__nav-list">
            <li>
              <Link href="/search">
                Search
              </Link>
            </li>
            <li className="site-header__nav-item">
              <Link href="/states">
                States
              </Link>
            </li>
            <li className="site-header__nav-item">
              <Link href="/candidates">
                Candidates
              </Link>
            </li>
            <li className="site-header__nav-submit">
              <Link
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
              >
                Submit a Candidate
              </Link>
            </li>
            <li className="site-header__nav-about">
              <Link href="/about">
                About
              </Link>
            </li>
            <li className="site-header__nav-report">
              <Link href="/report">
                Report an Issue
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
