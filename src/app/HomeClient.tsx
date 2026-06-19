"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EvidenceCard } from "../components/EvidenceCard";
import { NigeriaStatesMap } from "../components/NigeriaStatesMap";
import { SafeCandidateCard } from "../components/SafeCandidateCard";
import { SearchFilter } from "../components/SearchFilter";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { useCarouselIndex } from "../hooks/useCarouselIndex";
import { nigeriaGeo } from "../data/nigeria.js";

import type {
  Candidate,
  Fact,
  PollingUnitStateStat,
} from "../types/domain";

const CAROUSEL_DELAY_MS = 60000;
const MIN_SWIPE_DISTANCE = 50;

type Props = {
  candidates?: Candidate[];
  facts?: Fact[];
  initialLga?: string;
  initialStateId?: string;
  pollingUnitStateStats?: PollingUnitStateStat[];
};

const POLLING_UNIT_TOP_LIMIT = 6;

export function HomePage({
  candidates = [],
  facts = [],
  initialLga = "",
  initialStateId = "",
  pollingUnitStateStats = [],
}: Props) {
  const router = useRouter();
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
    if (pointerStartX === null || facts.length === 0) return;

    if (pointerEndX === null) {
      // Pure click (no pointer move)
      setFeaturedIndex((featuredIndex + 1) % facts.length);
    } else {
      const distance = pointerStartX - pointerEndX;
      if (distance > MIN_SWIPE_DISTANCE) {
        // Swipe left (next)
        setFeaturedIndex((featuredIndex + 1) % facts.length);
      } else if (distance < -MIN_SWIPE_DISTANCE) {
        // Swipe right (prev)
        setFeaturedIndex((featuredIndex - 1 + facts.length) % facts.length);
      } else {
        // Tiny swipe, treat as click
        setFeaturedIndex((featuredIndex + 1) % facts.length);
      }
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

  const totalStates = nigeriaGeo.filter((state) => state.id !== "fct").length;
  const totalLgas = nigeriaGeo.reduce((sum, state) => sum + state.lgas.length, 0);
  const totalZones = new Set(
    nigeriaGeo
      .map((state) => state.zone)
      .filter((zone): zone is string => Boolean(zone?.trim())),
  ).size;
  const statsMarqueeItems = [
    {
      label: "States",
      value: totalStates.toString(),
      detail: "Across the federation",
    },
    {
      label: "LGAs",
      value: totalLgas.toString(),
      detail: "Local governments",
    },
    {
      label: "Wards",
      value: "8,809",
      detail: "Electoral wards",
    },
    {
      label: "Polling units",
      value: "176,750",
      detail: "Voting locations",
    },
    {
      label: "Senate seats",
      value: "109",
      detail: "National Assembly",
    },
    {
      label: "House of Reps seats",
      value: "360",
      detail: "Federal constituencies",
    },
    {
      label: "Geopolitical zones",
      value: totalZones.toString(),
      detail: "Regional divisions",
    },
  ];
  const topStates = useMemo(() => {
    const stateNames = new Map(nigeriaGeo.map((state) => [state.id, state.name]));
    const counts = new Map<string, number>();

    for (const candidate of candidates) {
      const stateId = candidate.stateId?.toLowerCase();
      if (!stateId || !stateNames.has(stateId)) continue;
      counts.set(stateId, (counts.get(stateId) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([stateId, count]) => ({
        count,
        label: stateNames.get(stateId) ?? stateId,
        stateId,
      }))
      .sort((a, b) => (b.count !== a.count ? b.count - a.count : a.label.localeCompare(b.label)))
      .slice(0, 5);
  }, [candidates]);

  const topPollingUnitStates = useMemo(() => {
    if (pollingUnitStateStats.length === 0) return [] as PollingUnitStateStat[];
    return pollingUnitStateStats.slice(0, POLLING_UNIT_TOP_LIMIT);
  }, [pollingUnitStateStats]);

  const pollingUnitDatasetTotals = useMemo(() => {
    if (pollingUnitStateStats.length === 0) {
      return {
        states: 0,
        lgas: 0,
        wards: 0,
        pollingUnits: 0,
      };
    }

    return pollingUnitStateStats.reduce(
      (acc, stat) => ({
        states: acc.states + 1,
        lgas: acc.lgas + stat.lgaCount,
        wards: acc.wards + stat.wardCount,
        pollingUnits: acc.pollingUnits + stat.pollingUnitCount,
      }),
      { states: 0, lgas: 0, wards: 0, pollingUnits: 0 },
    );
  }, [pollingUnitStateStats]);

  function formatPollingMetric(value: number): string {
    return value > 0 ? value.toLocaleString("en-NG") : "—";
  }

  return (
    <>
      <SiteHeader />

      <main id="main-content">
        <section className="hero">
          <div className="hero__left">
            <h1 className="hero__title">
              <span>Get Involved</span>
              <span className="hero__title-emphasis">Know Your Candidates</span>
            </h1>
            <p className="hero__lede">
              Find any candidate. Select a state and local government.
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
            <p className="ds-eyebrow today-label">Nigeria · Important Election Details</p>
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

        <section
          className="stats-marquee"
          aria-label="Nigeria election statistics"
        >
          <div className="stats-marquee__inner">
            <div className="stats-marquee__viewport">
              <div className="stats-marquee__track">
                {[0, 1].map((duplicateIndex) => (
                  <ul
                    aria-hidden={duplicateIndex === 1}
                    className="stats-marquee__list"
                    key={duplicateIndex}
                  >
                    {statsMarqueeItems.map((item) => (
                      <li className="stats-marquee__item" key={`${duplicateIndex}-${item.label}`}>
                        <span className="stats-marquee__label">{item.label}</span>
                        <strong className="stats-marquee__value">{item.value}</strong>
                        <span className="stats-marquee__detail">{item.detail}</span>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="home-explore" aria-label="Explore candidates by state">
          <div className="home-explore__inner">
            <div className="home-explore__left">
              <p className="ds-eyebrow ds-eyebrow--accent">Explore Nigeria</p>
              <h2 className="home-explore__title">Explore candidates by state</h2>
              <p className="home-explore__lede">
                Browse the map, open any state, and quickly see who is contesting
                in your part of the country.
              </p>
              <div className="home-explore__actions">
                <Link className="ds-button ds-button--primary" href="/states">
                  Explore all states →
                </Link>
              </div>
            </div>

            <div className="home-explore__map" aria-label="Nigeria map">
              <NigeriaStatesMap
                className="home-explore__map-svg"
                onSelectState={(stateId) => router.push(`/states?state=${stateId}`)}
              />
            </div>

            <aside className="home-explore__right" aria-label="Top states by candidates">
              <div className="home-explore__top">
                <p className="ds-eyebrow ds-eyebrow--accent">Top states by candidates</p>
                {topStates.length > 0 ? (
                  <ol className="home-explore__top-list" start={1}>
                    {topStates.map((item, index) => (
                      <li key={item.stateId} className="home-explore__top-item">
                        <Link
                          className="home-explore__top-link"
                          href={`/states?state=${item.stateId}`}
                        >
                          <span aria-hidden="true" className="home-explore__top-rank">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="home-explore__top-name">{item.label}</span>
                          <span className="home-explore__top-count">
                            {item.count.toLocaleString("en-NG")}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="home-explore__empty">
                    State totals will appear here as candidate records are added.
                  </p>
                )}
                <Link className="ds-inline-link" href="/states">
                  View all states →
                </Link>
              </div>
            </aside>
          </div>
        </section>

        <section
          className="home-watch"
          aria-label="Find your polling unit by state"
        >
          <div className="home-watch__inner">
            <header className="home-watch__intro">
              <div className="home-watch__intro-text">
                <p className="ds-eyebrow ds-eyebrow--accent">Polling Unit Watch</p>
                <h2 className="home-watch__title">Find your polling unit</h2>
                <p className="home-watch__lede">
                  Save the polling unit where you will vote on election day. The
                  states with the most LGAs, wards, and polling units are where
                  the biggest citizen turnouts happen — start there.
                </p>
              </div>
              {pollingUnitDatasetTotals.states > 0 && (
                <dl
                  aria-label={`Polling divisions in the top ${topPollingUnitStates.length} states by polling units`}
                  className="home-watch__totals"
                >
                  <div>
                    <dt>States shown</dt>
                    <dd>{formatPollingMetric(pollingUnitDatasetTotals.states)}</dd>
                  </div>
                  <div>
                    <dt>LGAs shown</dt>
                    <dd>{formatPollingMetric(pollingUnitDatasetTotals.lgas)}</dd>
                  </div>
                  <div>
                    <dt>Wards shown</dt>
                    <dd>{formatPollingMetric(pollingUnitDatasetTotals.wards)}</dd>
                  </div>
                  <div>
                    <dt>Polling units shown</dt>
                    <dd>{formatPollingMetric(pollingUnitDatasetTotals.pollingUnits)}</dd>
                  </div>
                </dl>
              )}
            </header>

            {topPollingUnitStates.length > 0 ? (
              <ol
                className="home-watch__grid"
                aria-label="States ranked by polling unit divisions"
                start={1}
              >
                {topPollingUnitStates.map((stat) => (
                  <li key={stat.stateId}>
                    <Link
                      aria-label={`Open ${stat.stateName} polling units on Polling Unit Watch`}
                      className="home-watch__card"
                      href={`/polling-units?state=${encodeURIComponent(stat.stateId)}`}
                    >
                      <div className="home-watch__card-body">
                        <h3 className="home-watch__state">{stat.stateName}</h3>
                        <dl className="home-watch__metrics">
                          <div className="home-watch__metric">
                            <dt>LGAs</dt>
                            <dd>{formatPollingMetric(stat.lgaCount)}</dd>
                          </div>
                          <div className="home-watch__metric">
                            <dt>Wards</dt>
                            <dd>{formatPollingMetric(stat.wardCount)}</dd>
                          </div>
                          <div className="home-watch__metric home-watch__metric--accent">
                            <dt>Polling units</dt>
                            <dd>{formatPollingMetric(stat.pollingUnitCount)}</dd>
                          </div>
                        </dl>
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="home-watch__empty">
                Polling-unit totals will appear here once the dataset is
                imported. You can still search the directory now.
              </p>
            )}

            <div className="home-watch__footer">
              <Link className="ds-button ds-button--primary" href="/polling-units">
                Open Polling Unit Watch →
              </Link>
            </div>
          </div>
        </section>

        <section
          className="home-journey"
          aria-labelledby="home-journey-heading"
        >
          <div className="home-journey__inner">
            <div className="home-journey__intro">
              <p className="ds-eyebrow ds-eyebrow--accent">
                Everything you need to stay informed
              </p>
              <h2 className="home-journey__title" id="home-journey-heading">
                Know who is running.
              </h2>
              <p className="home-journey__lede">
                Search for candidates, confirm the information with public
                sources, and help keep the directory accurate when something is
                missing or wrong.
              </p>
            </div>

            <div className="home-journey__grid">
              <article className="home-journey__card">
                <p className="ds-eyebrow home-journey__card-kicker">Search candidates</p>
                <h3 className="home-journey__card-title">Find who is on the ballot</h3>
                <p className="home-journey__card-body">
                  Search candidates by name, office, party, state, or local
                  government to quickly locate the records that matter to you.
                </p>
              </article>

              <article className="home-journey__card">
                <p className="ds-eyebrow home-journey__card-kicker">Verify information</p>
                <h3 className="home-journey__card-title">Check the sources yourself</h3>
                <p className="home-journey__card-body">
                  Open candidate profiles and follow source links from public
                  records, so every important claim can be checked directly.
                </p>
              </article>

              <article className="home-journey__card">
                <p className="ds-eyebrow home-journey__card-kicker">Get involved</p>
                <h3 className="home-journey__card-title">Help improve the directory</h3>
                <p className="home-journey__card-body">
                  Submit corrections, share missing information, and contribute to
                  a stronger public record for everyone using the platform.
                </p>
              </article>
            </div>

            <div className="home-journey__rail">
              <div className="home-journey__steps">
                <p className="ds-eyebrow ds-eyebrow--accent">How it works</p>
                <ol className="home-journey__steps-list">
                  <li className="home-journey__step">
                    <span className="home-journey__step-number">1</span>
                    <div>
                      <h3 className="home-journey__step-title">Search</h3>
                      <p className="home-journey__step-body">
                        Search for any candidate by name, office, party, or location.
                      </p>
                    </div>
                  </li>
                  <li className="home-journey__step">
                    <span className="home-journey__step-number">2</span>
                    <div>
                      <h3 className="home-journey__step-title">Explore</h3>
                      <p className="home-journey__step-body">
                        Open profiles, compare details, and follow citations to public
                        sources.
                      </p>
                    </div>
                  </li>
                  <li className="home-journey__step">
                    <span className="home-journey__step-number">3</span>
                    <div>
                      <h3 className="home-journey__step-title">Decide</h3>
                      <p className="home-journey__step-body">
                        Use verified information to make informed decisions and vote
                        wisely.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>

              <aside className="home-journey__cta">
                <p className="ds-eyebrow ds-eyebrow--accent">Your vote. Your future.</p>
                <p className="home-journey__cta-body">
                  Get informed, verify sources, and help improve the directory.
                </p>
                <Link className="ds-inline-link" href="/submit-candidate">
                  Get involved today →
                </Link>
                <p className="home-journey__cta-note">
                  Join thousands of citizens taking action.
                </p>
              </aside>
            </div>
          </div>
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
