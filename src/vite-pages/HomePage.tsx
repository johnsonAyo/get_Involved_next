import { useState } from "react";
import { EvidenceCard } from "../components/EvidenceCard";
import { SafeCandidateCard } from "../components/SafeCandidateCard";
import { SearchFilter } from "../components/SearchFilter";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { useCandidates } from "../hooks/useCandidates";
import { useCarouselIndex } from "../hooks/useCarouselIndex";
import { useFacts } from "../hooks/useFacts";
import { POSITIONS } from "../data/positions.js";

const CAROUSEL_DELAY_MS = 8000;
const MIN_SWIPE_DISTANCE = 50;

type Props = {
  onNavigate: (path: string) => void;
};

function getInitialSearchFilterState() {
  const queryParams = new URLSearchParams(window.location.search);
  return {
    initialStateId: queryParams.get("state") || "",
    initialLga: queryParams.get("lga") || "",
  };
}

export function HomePage({ onNavigate }: Props) {
  const { data: candidates = [] } = useCandidates();
  const { data: facts = [] } = useFacts();
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
    if (pointerStartX === null || pointerEndX === null) return;
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
  const { initialStateId, initialLga } = getInitialSearchFilterState();

  const presCandidates = candidates.filter((c) => c.position === POSITIONS.PRESIDENTIAL_CANDIDATE);
  const ndcPres = presCandidates.find((c) => c.partyId?.toLowerCase() === "ndc");
  const apcPres = presCandidates.find((c) => c.partyId?.toLowerCase() === "apc");
  const adcPres = presCandidates.find((c) => c.partyId?.toLowerCase() === "adc");
  const presidents = [ndcPres, apcPres, adcPres].filter((c): c is typeof candidates[number] => !!c);

  const governors = candidates
    .filter((c) => c.position === POSITIONS.GOVERNOR)
    .sort((a, b) => (a.candidateName || "").localeCompare(b.candidateName || ""))
    .slice(0, 2);

  const senators = candidates
    .filter((c) => c.position === POSITIONS.SENATOR)
    .sort((a, b) => (a.candidateName || "").localeCompare(b.candidateName || ""))
    .slice(0, 2);

  const reps = candidates
    .filter((c) => c.position === POSITIONS.HOUSE_OF_REPS)
    .sort((a, b) => (a.candidateName || "").localeCompare(b.candidateName || ""))
    .slice(0, 1);

  const assembly = candidates
    .filter((c) => c.position === POSITIONS.HOUSE_OF_ASSEMBLY_STATE)
    .sort((a, b) => (a.candidateName || "").localeCompare(b.candidateName || ""))
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
      <SiteHeader onNavigate={onNavigate} />

      <main id="main-content">
        <aside className="editorial-band" aria-label="Election cycle notice">
          <a
            className="editorial-band__link"
            href="/candidates"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("/candidates");
            }}
          >
            <span className="ds-eyebrow ds-eyebrow--accent">
              36 states · 774 local governments
            </span>
            <span className="editorial-band__headline">
              Search any name. See <em>who is contesting</em> and{" "}
              <em>under which party.</em>
            </span>
            <span className="editorial-band__cta">Start searching →</span>
          </a>
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
              onNavigate={onNavigate}
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
                <a
                  href="/submit-candidate"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate("/submit-candidate");
                  }}
                  style={{
                    color: "var(--ds-color-accent)",
                    fontWeight: "bold",
                    textDecoration: "underline",
                  }}
                >
                  submit their profile here
                </a>
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
              <a
                className="ds-inline-link"
                href="/candidates"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate("/candidates");
                }}
              >
                Search the full directory →
              </a>
            </header>
          </div>
          <ul className="recent__grid">
            {homepageCandidates.map((candidate) => (
              <SafeCandidateCard
                key={candidate.id}
                candidate={candidate}
                onNavigate={onNavigate}
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
            <a
              className="ds-inline-link"
              href="/about"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("/about");
              }}
            >
              About →
            </a>
            <a
              className="ds-inline-link"
              href="/states"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("/states");
              }}
            >
              Browse all 36 states →
            </a>
            <a
              className="ds-inline-link"
              href="/report"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("/report");
              }}
            >
              Request a correction →
            </a>
          </div>
        </section>
      </main>

      <SiteFooter onNavigate={onNavigate} />
    </>
  );
}
