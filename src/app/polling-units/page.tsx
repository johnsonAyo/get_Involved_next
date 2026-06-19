import Link from "next/link";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getPollingUnits, getDirectoryStates } from "@/lib/content-store.server";
import type { PollingUnit } from "@/types/domain";
import { PollingUnitSearchForm, SavedPollingUnitCard } from "./PollingUnitWatchClient";
import { ServerPagination } from "@/components/ServerPagination";

type SearchParams = Record<string, string | string[] | undefined>;

function readSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : undefined;
}

function pollingUnitPath(unit: PollingUnit): string {
  return `/polling-units/${encodeURIComponent(unit.pollingUnitCode || unit.id)}`;
}

function readDirection(value: string | undefined): "next" | "prev" {
  return value === "prev" ? "prev" : "next";
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("en").format(value);
}

function buildPollingUnitsHref({
  cursor,
  direction,
  lga,
  query,
  state,
  ward,
  page,
}: {
  cursor?: string;
  direction?: "next" | "prev";
  lga: string;
  query: string;
  state: string;
  ward: string;
  page?: number;
}): string {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  if (state) params.set("state", state);
  if (lga) params.set("lga", lga);
  if (ward) params.set("ward", ward);
  if (page) params.set("page", String(page));
  if (cursor && !page) params.set("cursor", cursor);
  if (cursor && !page && direction === "prev") params.set("direction", direction);

  const nextQuery = params.toString();
  return nextQuery ? `/polling-units?${nextQuery}` : "/polling-units";
}

function PollingUnitResult({ unit }: { unit: PollingUnit }) {
  return (
    <li>
      <Link className="polling-unit-line" href={pollingUnitPath(unit)}>
        <div className="polling-unit-line__main">
          <h2>{unit.pollingUnitName}</h2>
          <p>
            {unit.ward}, {unit.lga}, {unit.state}
          </p>
        </div>
      </Link>
    </li>
  );
}

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (searchParams ? await searchParams : {}) as SearchParams;
  const query = readSearchParam(params.query) || "";
  const state = readSearchParam(params.state) || "";
  const lga = readSearchParam(params.lga) || "";
  const ward = readSearchParam(params.ward) || "";
  const cursor = readSearchParam(params.cursor) || "";
  const pageParam = readSearchParam(params.page);
  const page = pageParam ? parseInt(pageParam, 10) : 1;
  const direction = readDirection(readSearchParam(params.direction));
  const [pollingUnitsResult, states] = await Promise.all([
    getPollingUnits({ cursor, direction, lga, query, state, ward, page }),
    getDirectoryStates(),
  ]);
  const pollingUnits = pollingUnitsResult.items;
  const filterLabel = state || lga || ward || query ? "Filtered polling units" : "All polling units";
  const previousHref = pollingUnitsResult.previousCursor
    ? buildPollingUnitsHref({
        cursor: pollingUnitsResult.previousCursor,
        direction: "prev",
        lga,
        query,
        state,
        ward,
      })
    : "";
  const nextHref = pollingUnitsResult.nextCursor
    ? buildPollingUnitsHref({
        cursor: pollingUnitsResult.nextCursor,
        direction: "next",
        lga,
        query,
        state,
        ward,
      })
    : "";

  return (
    <>
      <SiteHeader />

      <main className="polling-watch" id="main-content">
        <div className="polling-watch__inner">
          <PageBreadcrumb
            items={[
              { href: "/", label: "Home" },
              { label: "Polling Unit Watch" },
            ]}
          />

          <section className="polling-watch__intro" aria-labelledby="polling-watch-title">
            <div className="polling-watch__intro-copy">
              <p className="ds-eyebrow ds-eyebrow--accent">Polling Unit Watch</p>
              <h1 className="ds-page-title" id="polling-watch-title">
                Find your polling unit
              </h1>
              <p>
                Save it now. Return on election day to post anonymous updates from the official polling unit record.
              </p>
            </div>

            <div className="polling-watch__stats" aria-label="Polling Unit Watch dataset">
              <div>
                <strong>37</strong>
                <span>States/FCT</span>
              </div>
              <div>
                <strong>774</strong>
                <span>LGAs</span>
              </div>
              <div>
                <strong>8,809</strong>
                <span>Wards</span>
              </div>
              <div>
                <strong>176,750</strong>
                <span>Polling units</span>
              </div>
            </div>
          </section>

          <SavedPollingUnitCard />

          <PollingUnitSearchForm
            initialLga={lga}
            initialQuery={query}
            initialState={state}
            initialWard={ward}
            states={states}
          />

          <section className="polling-watch__results" aria-live="polite">
            <div className="polling-watch__section-heading">
              <div>
                <p className="ds-eyebrow">{filterLabel}</p>
                <h2>
                  {pollingUnitsResult.total !== undefined ? (
                    `Showing ${formatCount(pollingUnits.length)} of ${formatCount(pollingUnitsResult.total)} polling unit${pollingUnitsResult.total === 1 ? "" : "s"}`
                  ) : (
                    `Showing ${formatCount(pollingUnits.length)} polling unit${pollingUnits.length === 1 ? "" : "s"}`
                  )}
                </h2>
              </div>
              <p className="polling-watch__result-count">
                {pollingUnitsResult.hasNextPage ? "More records available" : "End of results"}
              </p>
            </div>

            {pollingUnits.length > 0 ? (
              <>
                <ul className="polling-watch__result-list">
                  {pollingUnits.map((unit) => (
                    <PollingUnitResult key={unit.id} unit={unit} />
                  ))}
                </ul>

                {pollingUnitsResult.totalPages ? (
                  <ServerPagination
                    currentPage={pollingUnitsResult.currentPage || 1}
                    pageCount={pollingUnitsResult.totalPages}
                    buildHref={(p) =>
                      buildPollingUnitsHref({
                        lga,
                        query,
                        state,
                        ward,
                        page: p,
                      })
                    }
                  />
                ) : (
                  <nav className="pagination" aria-label="Polling unit pagination">
                    <div className="pagination__controls" style={{ justifyContent: 'center' }}>
                      {pollingUnitsResult.hasPreviousPage && previousHref ? (
                        <Link className="pagination__direction" href={previousHref}>
                          ← Previous
                        </Link>
                      ) : (
                        <button className="pagination__direction" disabled type="button">
                          ← Previous
                        </button>
                      )}
                      {pollingUnitsResult.hasNextPage && nextHref ? (
                        <Link className="pagination__direction" href={nextHref}>
                          Next →
                        </Link>
                      ) : (
                        <button className="pagination__direction" disabled type="button">
                          Next →
                        </button>
                      )}
                    </div>
                  </nav>
                )}
              </>
            ) : (
              <div className="search-filter__no-results polling-watch__empty">
                <p className="ds-eyebrow">No polling unit found</p>
                <p>
                  Try the polling unit code, school or street name, ward, LGA, or state. You can also search with fewer words.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
