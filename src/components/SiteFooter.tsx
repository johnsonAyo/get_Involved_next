import { Wordmark } from "./Wordmark";
import Link from "next/link";

export function SiteFooter() {
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
              <Link href="/about">
                About
              </Link>
            </li>
            <li>
              <Link href="/states">
                All 36 states
              </Link>
            </li>
            <li>
              <Link href="/candidates">
                Candidates
              </Link>
            </li>
            <li>
              <Link href="/report">
                Corrections
              </Link>
            </li>
            <li>
              <Link href="/report">
                Report an issue
              </Link>
            </li>
          </ul>
        </nav>
        <div className="site-footer__reply">
          <p className="ds-eyebrow ds-eyebrow--accent">Submit a candidate</p>
          <p>
            If you have any aspirant or candidate not on this profile,{" "}
            <Link
              href="/submit-candidate"
              style={{ color: "var(--ds-color-accent)", fontWeight: "bold" }}
            >
              submit their profile here
            </Link>
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
