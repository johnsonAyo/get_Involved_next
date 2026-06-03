"use client";

import { useState } from "react";
import Link from "next/link";
import { EvidenceCard } from "../components/EvidenceCard";
import { SafeCandidateCard } from "../components/SafeCandidateCard";
import { SearchFilter } from "../components/SearchFilter";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { useCarouselIndex } from "../hooks/useCarouselIndex";

import type { Candidate, Fact } from "../types/domain";

const CAROUSEL_DELAY_MS = 8000;
const MIN_SWIPE_DISTANCE = 50;

type Props = {
  candidates?: Candidate[];
  facts?: Fact[];
  initialLga?: string;
  initialStateId?: string;
};

export function HomePage({
  candidates = [],
  facts = [],
  initialLga = "",
  initialStateId = "",
}: Props) {
  const { index: featuredIndex, setIndex: setFeaturedIndex } = useCarouselIndex({
    delayMs: CAROUSEL_DELAY_MS,
    length: facts.length,
  });

  const [pointerStartX, setPointerStartX] = useState<number | null>(null);
  const [pointerEndX, setPointerEndX] = useState<number | null>(null);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    setPointerEndX(null);
    setPointerStartX(e.clientX);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (pointerStartX !== null) {
      setPointerEndX(e.clientX);
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (pointerStartX === null || pointerEndX === null || facts.length === 0) return;
    const distance = pointerStartX - pointerEndX;
    if (distance > MIN_SWIPE_DISTANCE) {
      // Swipe left (next)
      setFeaturedIndex((featuredIndex + 1) % facts.length);
    } else if (distance < -MIN_SWIPE_DISTANCE) {
      // Swipe right (prev)
      setFeaturedIndex((featuredIndex - 1 + facts.length) % facts.length);
    }
    setPointerStartX(null);
    setPointerEndX(null);
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  const featuredFact = facts[featuredIndex] ?? facts[0];

  const presCandidates = candidates.filter((c) => c.position === "president");
  const ndcPres = presCandidates.find((c) => c.partyId?.toLowerCase() === "ndc");
  const apcPres = presCandidates.find((c) => c.partyId?.toLowerCase() === "apc");
  const adcPres = presCandidates.find((c) => c.partyId?.toLowerCase() === "adc");
  const presidents = [ndcPres, apcPres, adcPres].filter((c): c is typeof candidates[number] => !!c);

  const governors = candidates
    .filter((c) => c.position === "governor")
    .slice(0, 2);

  const senators = candidates
    .filter((c) => c.position === "senator")
    .slice(0, 2);

  const reps = candidates
    .filter((c) => c.position === "house-of-reps")
    .slice(0, 1);

  const assembly = candidates
    .filter((c) => c.position === "state-house-of-assembly")
    .slice(0, 1);

  const homepageCandidates = [
    ...presidents,
    ...governors,
    ...senators,
    ...reps,
    ...assembly,
  ];

  return (
    <>
      <SiteHeader />

      <main id="main-content">
        <aside className="editorial-band" aria-label="Election cycle notice">
          <Link className="editorial-band__link" href="/candidates">
            <span className="ds-eyebrow ds-eyebrow--accent">
              36 states · 774 local governments
            </span>
            <span className="editorial-band__headline">
              Search any name. See <em>who is contesting</em> and{" "}
              <em>under which party.</em>
            </span>
            <span className="editorial-band__cta">Start searching →</span>
          </Link>
        </aside>

        <section className="hero">
          <div className="hero__left">
            <p className="ds-eyebrow">
              House of Representatives 360 seats · Senate 109 seats
            </p>
            <h1 className="hero__title">
              <span>Get Involved</span>
              <span className="hero__title-emphasis">Know Your Candidates</span>
            </h1>
            <p className="hero__lede">
              Search any candidate name. Select your state and local government.
              See every party contesting and{" "}
              <strong>exactly who is on the ballot.</strong>
            </p>

            <SearchFilter
              initialStateId={initialStateId}
              initialLga={initialLga}
            />

            <div className="hero__submit-candidate" style={{ marginTop: "1rem" }}>
              <p
                className="ds-meta"
                style={{
                  marginBottom: "0.5rem",
                  color: "var(--ds-color-ink-soft)",
                }}
              >
                If you have any aspirant or candidate not on this profile,{" "}
                <Link
                  href="/submit-candidate"
                  style={{
                    color: "var(--ds-color-accent)",
                    fontWeight: "bold",
                    textDecoration: "underline",
                  }}
                >
                  submit their profile here
                </Link>
                .
              </p>
            </div>
          </div>

          <aside className="hero__right" aria-label="Nigeria election facts">
            <p className="ds-eyebrow today-label">Nigeria · Election facts</p>
            {featuredFact && (
              <div
                className="carousel"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                style={{ touchAction: "pan-y" }}
              >
                <EvidenceCard
                  item={featuredFact}
                  tilt={featuredIndex % 2 === 0 ? "left" : "right"}
                />
                <p className="ds-meta carousel__caption">
                  ↔ Swipe to see more ·{" "}
                  {String(featuredIndex + 1).padStart(2, "0")} /{" "}
                  {String(facts.length).padStart(2, "0")}
                </p>
                <div
                  className="carousel__dots"
                  role="tablist"
                  aria-label="Facts position"
                >
                  {facts.map((fact, index) => (
                    <button
                      aria-label={`Show fact ${fact.id}`}
                      aria-selected={index === featuredIndex}
                      key={fact.id}
                      onClick={() => setFeaturedIndex(index)}
                      role="tab"
                      tabIndex={index === featuredIndex ? 0 : -1}
                      type="button"
                    />
                  ))}
                </div>
              </div>
            )}
          </aside>
        </section>

        <section className="recent" aria-labelledby="deck-heading">
          <div className="recent__header-wrap">
            <header className="section-header">
              <div className="section-header__text">
                <p className="ds-eyebrow ds-eyebrow--accent">
                  From the directory
                </p>
                <h2 id="deck-heading">Candidates & parties</h2>
              </div>
              <Link className="ds-inline-link" href="/candidates">
                Search the full directory →
              </Link>
            </header>
          </div>
          <ul className="recent__grid">
            {homepageCandidates.map((candidate) => (
              <SafeCandidateCard
                key={candidate.id}
                candidate={candidate}
                variant="home"
              />
            ))}
          </ul>
        </section>

        <section className="ds-panel ds-panel--ink manifesto">
          <p className="ds-eyebrow ds-eyebrow--accent manifesto__pre">
            What this is
          </p>
          <p className="manifesto__body">
            Search candidates, filter by state and local government, and view
            profile directories.
          </p>
          <p className="manifesto__body">
            Explore{" "}
            <span className="manifesto__emphasis">
              who is contesting and under which party.
            </span>
          </p>
          <div className="manifesto__links">
            <Link className="ds-inline-link" href="/about">
              About →
            </Link>
            <Link className="ds-inline-link" href="/states">
              Browse all 36 states →
            </Link>
            <Link className="ds-inline-link" href="/report">
              Request a correction →
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
