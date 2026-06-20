import Link from "next/link";
import { notFound } from "next/navigation";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { NigeriaStatesMap } from "@/components/NigeriaStatesMap";
import { getPollingUnitById } from "@/lib/content-store.server";
import type { PollingUnit } from "@/types/domain";
import { PollingUnitActions } from "../PollingUnitWatchClient";
import { FeedForPU } from "@/components/election-feed/FeedForPU";

function locationConfidenceLabel(unit: PollingUnit): string {
  switch (unit.coordinateQuality) {
    case "site":
      return "Exact site location available";
    case "ward":
      return "Approximate ward location";
    case "lga":
      return "Approximate LGA location";
    case "state":
      return "Approximate state location";
    default:
      return "Location confidence not listed";
  }
}

function locationConfidenceCopy(unit: PollingUnit): string {
  switch (unit.coordinateQuality) {
    case "site":
      return "This map position is based on a site-level coordinate in the source data.";
    case "ward":
      return "This map position is approximate and may point to the ward area, not the exact polling unit gate.";
    case "lga":
      return "This map position is broad and may point to the local government area, not the exact site.";
    case "state":
      return "This map position is very broad and should not be used as exact directions.";
    default:
      return "The source did not include a public confidence label for this location.";
  }
}

function formatSourceDate(value?: string): string {
  if (!value) return "Source date not listed";

  try {
    return new Intl.DateTimeFormat("en", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "Source date not listed";
  }
}

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const unit = await getPollingUnitById(id);

  if (!unit) {
    notFound();
  }

  const mapUrl =
    unit.latitude !== undefined && unit.longitude !== undefined
      ? `https://www.google.com/maps/search/?api=1&query=${unit.latitude},${unit.longitude}`
      : null;
  const embedMapUrl =
    unit.latitude !== undefined && unit.longitude !== undefined
      ? `https://www.google.com/maps?q=${unit.latitude},${unit.longitude}&z=17&output=embed`
      : null;

  return (
    <>
      <SiteHeader />

      <main className="polling-unit-profile" id="main-content">
        <div className="polling-unit-profile__inner">
          <PageBreadcrumb
            items={[
              { href: "/", label: "Home" },
              { href: "/polling-units", label: "Polling Unit Watch" },
              { label: unit.pollingUnitCode || "Polling unit" },
            ]}
          />

          <article className="candidate-profile" aria-labelledby="polling-unit-title">
            <h1 className="ds-page-title candidate-profile__page-title" id="polling-unit-title">
              Polling unit record
            </h1>

            <div className="candidate-profile__grid">
              <div className="candidate-profile__sidebar">
                <section className="candidate-profile__hero polling-unit-profile__hero">
                  <div className="polling-unit-profile__identity">
                    <p className="ds-eyebrow ds-eyebrow--accent">
                      {unit.pollingUnitCode || "Official polling unit"}
                    </p>
                    <h2 className="polling-unit-profile__name">{unit.pollingUnitName}</h2>
                    <p>
                      {unit.ward}, {unit.lga}, {unit.state}
                    </p>
                  </div>

                  <PollingUnitActions unit={unit} />
                </section>

                <section className="candidate-profile__trust-card">
                  <ul className="candidate-profile__trust-list" aria-label="Polling unit record notes">
                    <li>Official polling-unit anchor</li>
                    <li>Anonymous updates open during election window</li>
                    <li>Saved only on this device</li>
                  </ul>
                </section>
              </div>

              <div className="candidate-profile__main">
                <section className="candidate-profile__section">
                  <div className="candidate-profile__section-heading">
                    <h2>Location</h2>
                  </div>
                  <div className="polling-unit-profile__map-grid">
                    {embedMapUrl ? (
                      <div className="polling-unit-profile__map" aria-label="Polling unit map">
                        <iframe
                          allowFullScreen
                          className="polling-unit-profile__map-frame"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          src={embedMapUrl}
                          title={`${unit.pollingUnitName} map`}
                        />
                      </div>
                    ) : null}

                    <div className="polling-unit-profile__state-map" aria-label="Nigeria map with selected state">
                      <NigeriaStatesMap activeStateId={unit.stateSlug} className="polling-unit-profile__state-map-svg" />
                    </div>
                  </div>
                  <div className="polling-unit-profile__location-block">
                    <div>
                      <p className="ds-eyebrow">Confidence</p>
                      <span className={`ds-pill ds-pill--${unit.coordinateQuality === "site" ? "success" : "warning"}`}>
                        {locationConfidenceLabel(unit)}
                      </span>
                    </div>
                    <div>
                      <p className="ds-eyebrow">Ward</p>
                      <strong>{unit.ward}</strong>
                    </div>
                    <div>
                      <p className="ds-eyebrow">LGA</p>
                      <strong>{unit.lga}</strong>
                    </div>
                    <div>
                      <p className="ds-eyebrow">State</p>
                      <strong>{unit.state}</strong>
                    </div>
                  </div>

                  {mapUrl ? (
                    <a className="candidate-profile__action polling-unit-profile__map-link" href={mapUrl} rel="noreferrer" target="_blank">
                      Open map location
                    </a>
                  ) : null}
                </section>

                <section className="candidate-profile__section">
                  <div className="candidate-profile__section-heading">
                    <h2>Election-day updates</h2>
                  </div>
                  <FeedForPU unit={unit} />
                </section>

                <section className="candidate-profile__section">
                  <div className="candidate-profile__section-heading">
                    <h2>Source</h2>
                  </div>
                  <p className="candidate-profile__aside-copy">
                    Polling-unit rows are attributed to INEC. Coordinates are imported with source quality labels so approximate pins are not presented as exact locations.
                  </p>
                  <ul className="candidate-profile__sources">
                    <li className="candidate-profile__source">
                      <div>
                        <p>Polling-unit snapshot</p>
                        <span className="polling-unit-profile__source-line">
                          Imported source generated {formatSourceDate(unit.sourceGeneratedAt)}
                        </span>
                        {unit.sourceSnapshotUrl ? (
                          <a href={unit.sourceSnapshotUrl} rel="noreferrer" target="_blank">
                            {unit.sourceSnapshotUrl}
                          </a>
                        ) : null}
                      </div>
                    </li>
                  </ul>
                </section>

                <div className="polling-unit-profile__back">
                  <Link className="candidate-profile__action" href="/polling-units">
                    Search another polling unit
                  </Link>
                </div>
              </div>
            </div>
          </article>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
