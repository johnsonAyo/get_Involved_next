"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getLgas } from "../data/nigeria.js";
import { sortedStates } from "../constants/nigeria";
import { toCandidateSearchPath } from "../lib/candidateSearch";
import { DropdownSelect } from "./DropdownSelect";

type Props = {
  initialStateId?: string;
  initialLga?: string;
};

export function SearchFilter({
  initialStateId = "",
  initialLga = "",
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [stateId, setStateId] = useState(initialStateId);
  const [lga, setLga] = useState(initialLga);

  const lgas = useMemo<string[]>(
    () => (stateId ? (getLgas(stateId) as string[]) : []),
    [stateId],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(
      toCandidateSearchPath({
        query,
        state: stateId,
        lga,
      }),
    );
  }

  return (
    <form
      className="search-filter search-filter--home"
      aria-label="Search candidates"
      onSubmit={handleSubmit}
    >
      <div className="search-filter__field search-filter__field--full">
        <label className="ds-eyebrow search-filter__label" htmlFor="sf-query">
          <span className="ds-desktop-only">Candidate or party name</span>
          <span className="ds-mobile-only">Candidate/Party</span>
        </label>
        <div className="search-filter__input-wrap">
          <svg
            aria-hidden="true"
            className="search-filter__icon"
            fill="none"
            height="18"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" x2="16.65" y1="21" y2="16.65" />
          </svg>
          <input
            autoComplete="off"
            className="search-filter__input"
            id="sf-query"
            placeholder="e.g. Tinubu, APC, Atiku…"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="search-filter__row">
        <div className="search-filter__field">
          <label className="ds-eyebrow search-filter__label" htmlFor="sf-state">
            State
          </label>
          <DropdownSelect
            id="sf-state"
            onChange={(state) => {
              setStateId(state);
              setLga("");
            }}
            options={sortedStates.map((state) => ({
              listLabel: state.name,
              value: state.id,
            }))}
            placeholder="All States"
            value={stateId}
          />
        </div>

        <div className="search-filter__field">
          <label className="ds-eyebrow search-filter__label" htmlFor="sf-lga">
            <span className="ds-desktop-only">Local government</span>
            <span className="ds-mobile-only">LGA</span>
          </label>
          <DropdownSelect
            disabled={!stateId}
            id="sf-lga"
            onChange={setLga}
            options={lgas.map((localGovernment) => ({
              listLabel: localGovernment,
              value: localGovernment,
            }))}
            placeholder={stateId ? "All local governments" : "Select a state first"}
            value={lga}
          />
        </div>
      </div>

      <button
        className="ds-button ds-button--primary search-filter__submit"
        type="submit"
      >
        Search candidates
      </button>
    </form>
  );
}
