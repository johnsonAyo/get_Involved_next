"use client";


import { useEffect, useState } from "react";
import type { PollingUnit } from "@/types/domain";
import { getFeedForPU, getTopOccurrences } from "@/app/actions/feed";
import type { FeedPostRow, OccurrenceRow } from "@/app/actions/feed";

const POLL_INTERVAL_MS = 30_000;

function formatLineTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

type Props = {
  unit: PollingUnit;
};

export function FeedForPU({ unit }: Props) {
  const [rows, setRows] = useState<FeedPostRow[]>([]);
  const [occurrences, setOccurrences] = useState<OccurrenceRow[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  async function refresh() {
    const [feed, occ] = await Promise.all([
      getFeedForPU(unit.id, 30),
      getTopOccurrences(unit.id, 12, 5),
    ]);
    setRows(feed);
    setOccurrences(occ);
    setLastRefreshedAt(new Date());
    setIsInitialLoading(false);
  }

  useEffect(() => {
    void refresh();

    function onPublished() {
      void refresh();
    }
    window.addEventListener("feed-post-published", onPublished as EventListener);

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    }, POLL_INTERVAL_MS);

    return () => {
      window.removeEventListener("feed-post-published", onPublished as EventListener);
      window.clearInterval(interval);
    };
  }, [unit.id]);

  return (
    <section className="feed-for-pu" aria-labelledby="feed-for-pu-title">
      <header className="feed-for-pu__head">
        <h2 id="feed-for-pu-title" className="feed-for-pu__title">
          Live updates · PU {unit.pollingUnitCode || unit.id}
        </h2>
        <p className="ds-eyebrow feed-for-pu__meta">
          {lastRefreshedAt
            ? `Refreshed ${formatLineTime(lastRefreshedAt.toISOString())} · checks every 30s`
            : "Loading…"}
        </p>
      </header>

      {occurrences.length > 0 ? (
        <aside className="feed-for-pu__top" aria-label="Top reported occurrences (last 12h)">
          <p className="ds-eyebrow ds-eyebrow--accent feed-for-pu__top-label">
            Top reported (12h)
          </p>
          <ul className="feed-for-pu__top-list">
            {occurrences.map((row) => (
              <li key={row.summary} className="feed-for-pu__top-item">
                <span className="feed-for-pu__top-summary">{row.summary}</span>
                <span className="feed-for-pu__top-count" aria-label={`${row.count} reports`}>
                  {row.count}
                </span>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}

      <ol className="feed-for-pu__list" aria-live="polite">
        {isInitialLoading ? (
          <li className="feed-for-pu__placeholder">Loading feed…</li>
        ) : rows.length === 0 ? (
          <li className="feed-for-pu__placeholder">
            No updates yet. Be the first to post from this unit.
          </li>
        ) : (
          rows.map((row, idx) => {
            const isNewest = idx === rows.length - 1;
            if (row.kind === "join") {
              return (
                <li
                  key={row.id}
                  className="feed-for-pu__row feed-for-pu__row--join"
                  data-newest={isNewest ? "true" : "false"}
                >
                  <span className="feed-for-pu__time">
                    {formatLineTime(row.posted_at)}
                  </span>
                  <span className="feed-for-pu__join-line">
                    Citizen <strong>{row.poster_label}</strong> has joined.
                  </span>
                </li>
              );
            }
            return (
              <li
                key={row.id}
                className="feed-for-pu__row feed-for-pu__row--post"
                data-newest={isNewest ? "true" : "false"}
              >
                <header className="feed-for-pu__row-head">
                  <span className="feed-for-pu__time">{formatLineTime(row.posted_at)}</span>
                  <span className="feed-for-pu__poster">{row.poster_label}</span>
                </header>
                <p className="feed-for-pu__body">{row.body}</p>
                <p className="feed-for-pu__summary-chip">{row.summary}</p>
              </li>
            );
          })
        )}
      </ol>
    </section>
  );
}
