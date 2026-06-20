"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { PollingUnit } from "@/types/domain";
import { DropdownSelect } from "@/components/DropdownSelect";
import { getPollingUnitLgas, getPollingUnitWards } from "@/app/actions/polling-units";

const SAVED_POLLING_UNIT_KEY = "get-involved:saved-polling-unit";

type SavedPollingUnit = {
  id: string;
  pollingUnitCode?: string;
  pollingUnitName: string;
  ward: string;
  lga: string;
  state: string;
  savedAt: string;
};

function pollingUnitPath(unit: Pick<PollingUnit, "id" | "pollingUnitCode"> | SavedPollingUnit): string {
  return `/polling-units/${encodeURIComponent(unit.pollingUnitCode || unit.id)}`;
}

function toSavedPollingUnit(unit: PollingUnit): SavedPollingUnit {
  return {
    id: unit.id,
    pollingUnitCode: unit.pollingUnitCode,
    pollingUnitName: unit.pollingUnitName,
    ward: unit.ward,
    lga: unit.lga,
    state: unit.state,
    savedAt: new Date().toISOString(),
  };
}

function readSavedPollingUnit(): SavedPollingUnit | null {
  try {
    const raw = window.localStorage.getItem(SAVED_POLLING_UNIT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedPollingUnit;
  } catch {
    return null;
  }
}

function writeSavedPollingUnit(unit: SavedPollingUnit) {
  window.localStorage.setItem(SAVED_POLLING_UNIT_KEY, JSON.stringify(unit));
  window.dispatchEvent(new CustomEvent("polling-unit-saved", { detail: unit }));
}

const STALE_TIME_MS = 5 * 60 * 1000; // 5 minutes

export function PollingUnitSearchForm({
  initialLga,
  initialQuery,
  initialState,
  initialWard,
  states,
}: {
  initialLga: string;
  initialQuery: string;
  initialState: string;
  initialWard?: string;
  states: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [state, setState] = useState(initialState);
  const [lga, setLga] = useState(initialLga);
  const [ward, setWard] = useState(initialWard || "");

  const { data: lgas = [] } = useQuery({
    queryKey: ["polling-unit-lgas", state],
    queryFn: () => getPollingUnitLgas(state),
    enabled: !!state,
    staleTime: STALE_TIME_MS,
  });

  const { data: wards = [] } = useQuery({
    queryKey: ["polling-unit-wards", state, lga],
    queryFn: () => getPollingUnitWards(state, lga),
    enabled: !!state && !!lga,
    staleTime: STALE_TIME_MS,
  });

  const stateOptions = useMemo(() => {
    return [...states]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((s) => ({
        listLabel: s.name,
        selectedLabel: s.name,
        value: s.id,
      }));
  }, [states]);

  const lgaOptions = useMemo(() => {
    return lgas.map((l) => ({
      listLabel: l,
      selectedLabel: l,
      value: l,
    }));
  }, [lgas]);

  const wardOptions = useMemo(() => {
    return wards.map((w) => ({
      listLabel: w,
      selectedLabel: w,
      value: w,
    }));
  }, [wards]);

  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery.trim()) params.set("query", debouncedQuery.trim());
    if (state) params.set("state", state);
    if (lga) params.set("lga", lga);
    if (ward) params.set("ward", ward);

    const newQueryStr = params.toString();
    const newPath = newQueryStr ? `/polling-units?${newQueryStr}` : "/polling-units";

    const currentSearch = window.location.search;
    const targetSearch = newQueryStr ? `?${newQueryStr}` : "";
    if (currentSearch !== targetSearch) {
      router.replace(newPath, { scroll: false });
    }
  }, [debouncedQuery, state, lga, ward, router]);

  return (
    <form
      className="search-filter polling-watch__search"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="polling-watch__search-row">
        <div className="search-filter__field polling-watch__search-main">
          <label className="ds-eyebrow search-filter__label" htmlFor="polling-unit-query">
            Find your polling unit
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
              id="polling-unit-query"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Code, name, ward, LGA, or state"
              type="search"
              value={query}
            />
          </div>
        </div>

        <div className="search-filter__field">
          <label className="ds-eyebrow search-filter__label" htmlFor="polling-unit-state">
            State
          </label>
          <DropdownSelect
            id="polling-unit-state"
            onChange={(val) => {
              setState(val);
              setLga("");
              setWard("");
            }}
            options={stateOptions}
            placeholder="All states"
            value={state}
          />
        </div>

        <div className="search-filter__field">
          <label className="ds-eyebrow search-filter__label" htmlFor="polling-unit-lga">
            LGA
          </label>
          <DropdownSelect
            disabled={!state}
            id="polling-unit-lga"
            onChange={(val) => {
              setLga(val);
              setWard("");
            }}
            options={lgaOptions}
            placeholder={state ? "All LGAs" : "Select a state"}
            value={lga}
          />
        </div>

        <div className="search-filter__field">
          <label className="ds-eyebrow search-filter__label" htmlFor="polling-unit-ward">
            Ward
          </label>
          <DropdownSelect
            disabled={!lga}
            id="polling-unit-ward"
            onChange={setWard}
            options={wardOptions}
            placeholder={lga ? "All Wards" : "Select an LGA"}
            value={ward}
          />
        </div>

      </div>
    </form>
  );
}

export function SavedPollingUnitCard() {
  const [savedUnit, setSavedUnit] = useState<SavedPollingUnit | null>(null);
  const [joinedId, setJoinedId] = useState<string | null>(null);

  useEffect(() => {
    setSavedUnit(readSavedPollingUnit());
    if (typeof window !== "undefined") {
      setJoinedId(window.localStorage.getItem("get-involved:joined-polling-unit-id"));
    }

    function handleSaved(event: Event) {
      const detail = (event as CustomEvent<SavedPollingUnit | null>).detail ?? null;
      const joined = window.localStorage.getItem("get-involved:joined-polling-unit-id");
      if (joined && (!detail || detail.id !== joined)) {
        return;
      }
      setSavedUnit(detail);
    }

    function handleJoined(event: Event) {
      const detail = (event as CustomEvent<{ pu_id: string } | null>).detail;
      setJoinedId(detail?.pu_id ?? null);
    }

    window.addEventListener("polling-unit-saved", handleSaved as EventListener);
    window.addEventListener("polling-unit-joined", handleJoined as EventListener);
    return () => {
      window.removeEventListener("polling-unit-saved", handleSaved as EventListener);
      window.removeEventListener("polling-unit-joined", handleJoined as EventListener);
    };
  }, []);

  if (!savedUnit) return null;

  const isJoined = Boolean(joinedId && joinedId === savedUnit.id);

  return (
    <section className="polling-watch__saved" aria-label="Saved polling unit">
      <div>
        <p className="ds-eyebrow ds-eyebrow--accent">My polling unit</p>
        <h2 className="polling-unit-profile__name">{savedUnit.pollingUnitName}</h2>
        <p>
          {savedUnit.pollingUnitCode ? `${savedUnit.pollingUnitCode} · ` : ""}
          {savedUnit.ward}, {savedUnit.lga}, {savedUnit.state}
        </p>
      </div>
      <div style={{ display: "flex", gap: "var(--ds-space-3)", flexWrap: "wrap", alignItems: "center" }}>
        <Link className="ds-button ds-button--ghost polling-watch__saved-link" href={pollingUnitPath(savedUnit)}>
          Open saved unit
        </Link>
        {!isJoined && (
          <button
            className="ds-button ds-button--ghost"
            onClick={() => {
              window.localStorage.removeItem(SAVED_POLLING_UNIT_KEY);
              window.dispatchEvent(new CustomEvent("polling-unit-saved", { detail: null }));
            }}
            type="button"
          >
            Remove
          </button>
        )}
      </div>
    </section>
  );
}

export function PollingUnitActions({ unit }: { unit: PollingUnit }) {
  const [isSaved, setIsSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [joinedId, setJoinedId] = useState<string | null>(null);

  useEffect(() => {
    const saved = readSavedPollingUnit();
    setIsSaved(Boolean(saved && saved.id === unit.id));

    if (typeof window !== "undefined") {
      setJoinedId(window.localStorage.getItem("get-involved:joined-polling-unit-id"));
    }
  }, [unit.id]);

  useEffect(() => {
    function handleJoined(event: Event) {
      const detail = (event as CustomEvent<{ pu_id: string } | null>).detail;
      setJoinedId(detail?.pu_id ?? null);
    }
    window.addEventListener("polling-unit-joined", handleJoined as EventListener);
    return () => window.removeEventListener("polling-unit-joined", handleJoined as EventListener);
  }, []);

  function toggleSaveUnit() {
    const joined = window.localStorage.getItem("get-involved:joined-polling-unit-id");
    if (joined) {
      setMessage("You cannot change your polling unit after joining.");
      return;
    }

    if (isSaved) {
      window.localStorage.removeItem(SAVED_POLLING_UNIT_KEY);
      window.dispatchEvent(new CustomEvent("polling-unit-saved", { detail: null }));
      setIsSaved(false);
      setMessage("Removed from this device.");
    } else {
      writeSavedPollingUnit(toSavedPollingUnit(unit));
      setIsSaved(true);
      setMessage("Saved on this device.");
    }
  }

  async function shareUnit() {
    const path = pollingUnitPath(unit);
    const url = `${window.location.origin}${path}`;
    const text = `I found my polling unit on Get Involved: ${unit.pollingUnitName}, ${unit.ward}, ${unit.lga}, ${unit.state}. On election day, citizens can post anonymous updates here.`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "Polling Unit Watch", text, url });
        setMessage("Share sheet opened.");
        return;
      }

      await navigator.clipboard.writeText(`${text}\n${url}`);
      setMessage("Share link copied.");
    } catch {
      setMessage("Share was not completed.");
    }
  }

  const isJoinedHere = Boolean(joinedId && joinedId === unit.id);
  const isJoinedElsewhere = Boolean(joinedId && joinedId !== unit.id);

  return (
    <div className="polling-unit-profile__actions">
      <button
        className="ds-button ds-button--primary"
        onClick={toggleSaveUnit}
        type="button"
        disabled={isJoinedElsewhere || isJoinedHere}
      >
        {isJoinedHere ? "Joined" : isSaved ? "Saved" : "Save this polling unit"}
      </button>
      <button className="ds-button ds-button--ghost" onClick={shareUnit} type="button">
        Share
      </button>
      {isJoinedHere && (
        <p className="ds-meta polling-unit-profile__action-note">
          You have joined this polling unit's watch feed.
        </p>
      )}
      {isJoinedElsewhere && (
        <p className="ds-meta polling-unit-profile__action-note">
          You cannot save this unit because you have already joined another polling unit's watch.
        </p>
      )}
      {!joinedId && message ? <p className="ds-meta polling-unit-profile__action-note">{message}</p> : null}
    </div>
  );
}
