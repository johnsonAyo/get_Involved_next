"use client";

import { DropdownSelect } from "@/components/DropdownSelect";
import type {
  ElectionFeedFilters as Filters,
  ElectionFeedStateOption,
} from "./mockMessages";
import type {
  ElectionFeedStateFilterOptions,
  ElectionFeedStateLoadingOptions,
} from "./useElectionFeedState";

type Props = {
  filters: Filters;
  options: ElectionFeedStateFilterOptions;
  loading: ElectionFeedStateLoadingOptions;
  onChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onReset: () => void;
};

const TIER_LABELS = ["State", "LGA", "Ward", "Polling Unit"] as const;

export function ElectionFeedFilters({
  filters,
  options,
  loading,
  onChange,
  onReset,
}: Props) {
  const hasAnyFilter =
    Boolean(filters.state) ||
    Boolean(filters.lga) ||
    Boolean(filters.ward) ||
    Boolean(filters.pollingUnit);

  const tiers = [
    {
      id: "election-feed-filter-state",
      key: "state" as const,
      data: options.state,
      value: filters.state,
      placeholder: loading.states ? "Loading states…" : "Select state",
      disabled: loading.states,
    },
    {
      id: "election-feed-filter-lga",
      key: "lga" as const,
      data: options.lga,
      value: filters.lga,
      placeholder: !filters.state
        ? "Select a state first"
        : loading.lga
          ? "Loading LGAs…"
          : "Select LGA",
      disabled: !filters.state || loading.lga,
    },
    {
      id: "election-feed-filter-ward",
      key: "ward" as const,
      data: options.ward,
      value: filters.ward,
      placeholder: !filters.lga
        ? "Select an LGA first"
        : loading.ward
          ? "Loading wards…"
          : "Select ward",
      disabled: !filters.lga || loading.ward,
    },
    {
      id: "election-feed-filter-pu",
      key: "pollingUnit" as const,
      data: options.pollingUnit,
      value: filters.pollingUnit,
      placeholder: !filters.ward
        ? "Select a ward first"
        : loading.pollingUnit
          ? "Loading polling units…"
          : "Select polling unit",
      disabled: !filters.ward || loading.pollingUnit,
    },
  ];

  return (
    <section
      className="election-feed__filters"
      aria-label="Filter election feed by location"
    >
      <ul className="election-feed__filter-row">
        {tiers.map((tier) => (
          <li key={tier.key} className="election-feed__filter-cell">
            <DropdownSelect
              id={tier.id}
              disabled={tier.disabled}
              onChange={(next) => onChange(tier.key, next)}
              options={tier.data.map((opt) => ({
                value: opt.value,
                listLabel: opt.label,
                selectedLabel: opt.label,
              }))}
              placeholder={tier.placeholder}
              showReset={false}
              value={tier.value}
              variant="compact"
            />
          </li>
        ))}
      </ul>

      {hasAnyFilter ? (
        <div className="election-feed__filter-active">
          <p className="election-feed__filter-active-label">
            Showing updates from{" "}
            <strong className="election-feed__filter-active-line">
              {[
                filters.pollingUnit,
                filters.ward,
                filters.lga,
                stateLabel(filters.state, options.state),
              ]
                .filter(Boolean)
                .join(" · ")}
            </strong>
          </p>
          <button
            type="button"
            className="election-feed__filter-reset"
            onClick={onReset}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <p className="election-feed__filter-active-label election-feed__filter-active--all">
          Showing live updates from every state in the feed.
        </p>
      )}
    </section>
  );
}

function stateLabel(
  slug: string,
  options: ReadonlyArray<ElectionFeedStateOption>,
): string {
  if (!slug) return "";
  return options.find((o) => o.value === slug)?.label ?? slug;
}
