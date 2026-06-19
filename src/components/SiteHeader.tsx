"use client";

import { useState } from "react";
import { Wordmark } from "./Wordmark";
import { ThemeToggle } from "./ThemeToggle";
import Link from "next/link";

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link aria-label="Will of the People home" href="/">
          <Wordmark className="ds-wordmark--header" />
        </Link>

        <div className="site-header__right">
          <nav className={`site-header__nav ${isMenuOpen ? "site-header__nav--open" : ""}`} aria-label="Primary">
            <ul className="site-header__nav-list">
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
              <li className="site-header__nav-item">
                <Link href="/polling-units">
                  PU Watch
                </Link>
              </li>
              <li className="site-header__nav-about">
                <Link href="/about">
                  About
                </Link>
              </li>
              <li className="site-header__nav-submit">
                <Link
                  href="/submit-candidate"
                  className="ds-button ds-button--primary"
                  style={{
                    minHeight: "auto",
                    minWidth: "auto",
                    padding: "0.5rem 0.8rem",
                    fontSize: "0.85rem",
                    background: "var(--ds-color-accent)",
                    borderColor: "var(--ds-color-accent)",
                    color: "var(--ds-color-accent-ink)",
                    width: "fit-content",
                  }}
                >
                  Submit Candidate
                </Link>
              </li>
              <li className="site-header__nav-report">
                <Link
                  href="/report"
                  className="ds-button ds-button--ghost"
                  style={{
                    minHeight: "auto",
                    minWidth: "auto",
                    padding: "0.5rem 0.8rem",
                    fontSize: "0.85rem",
                    width: "fit-content",
                  }}
                >
                  Report Issue
                </Link>
              </li>
            </ul>
          </nav>

          <div className="site-header__ctrls">
            <ThemeToggle />
            <button
              className="site-header__menu-toggle"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-label="Toggle navigation menu"
            >
              <span className={`site-header__menu-icon ${isMenuOpen ? "site-header__menu-icon--open" : ""}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
