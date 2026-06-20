"use client";


import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  checkJoinEligibility,
  getOrMintPosterLabel,
  publishFeedPost,
  suggestSummaries,
} from "@/app/actions/feed";
import type { MatchedSummary } from "@/lib/summary-matcher";

const SAVED_POLLING_UNIT_KEY = "get-involved:saved-polling-unit";
const FEED_SESSION_KEY = "get-involved:feed-session";
const PANEL_OPEN_STORAGE_KEY = "get-involved:election-feed-open";

const MIN_SEARCH_LENGTH = 4;
const MIN_SUGGESTIONS_LIMIT = 3;

const BASE_SUGGESTIONS: MatchedSummary[] = [
  {
    id: "accreditation-ongoing",
    summary: "accreditation is ongoing",
    matchedKeyword: "",
  },
  {
    id: "voting-started",
    summary: "voting has started",
    matchedKeyword: "",
  },
  {
    id: "bvas-failed",
    summary: "BVAS authentication issue",
    matchedKeyword: "",
  },
];

function getAutomaticTag(id: string): string {
  const parts = id.split("-");
  if (id.startsWith("card-reader")) return "#card-reader";
  if (id.startsWith("ballot-supply")) return "#ballot-papers";
  if (id.startsWith("started-late")) return "#started-late";
  if (id.startsWith("started-on-time")) return "#started-on-time";
  if (id.startsWith("assisted-voting")) return "#assisted-voting";
  return `#${parts[0]}`;
}


type SavedPollingUnit = {
  id: string;
  pollingUnitCode?: string;
  pollingUnitName: string;
  ward: string;
  lga: string;
  state: string;
  savedAt: string;
};

function readSavedPollingUnit(): SavedPollingUnit | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SAVED_POLLING_UNIT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedPollingUnit;
  } catch {
    return null;
  }
}

function readOrMintSessionToken(): string {
  if (typeof window === "undefined") return crypto.randomUUID();
  try {
    const existing = window.localStorage.getItem(FEED_SESSION_KEY);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    window.localStorage.setItem(FEED_SESSION_KEY, fresh);
    return fresh;
  } catch {
    return crypto.randomUUID();
  }
}

const EARTH_RADIUS_METERS = 6371000;
const MAX_JOIN_RADIUS_METERS = 1000;
const LOCATION_CHECK_TIMEOUT_MS = 10000;

function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
    Math.cos(phi2) *
    Math.sin(deltaLambda / 2) *
    Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

type ComposerState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "ok"; posterLabel: string }
  | { kind: "error"; message: string };

type Props = {
  onPosted?: () => void;
};

export function PostComposer({ onPosted }: Props) {
  const router = useRouter();

  function navigateToDirectory() {
    try {
      window.localStorage.setItem(PANEL_OPEN_STORAGE_KEY, "0");
    } catch {
    }
    if (onPosted) {
      onPosted();
    }
    router.push("/polling-units");
  }

  const [savedUnit, setSavedUnit] = useState<SavedPollingUnit | null>(() => readSavedPollingUnit());
  const [body, setBody] = useState("");
  const [candidates, setCandidates] = useState<MatchedSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [posterLabel, setPosterLabel] = useState<string | null>(null);
  const [state, setState] = useState<ComposerState>({ kind: "idle" });
  const [isFetching, setIsFetching] = useState(false);
  const sessionTokenRef = useRef<string>("");
  const onPostedTimerRef = useRef<number | null>(null);

  // Gated join flow state variables
  const [eligibilityLoading, setEligibilityLoading] = useState(true);
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [joinEnabled, setJoinEnabled] = useState(false);
  const [puCoords, setPuCoords] = useState<{ latitude: number | null; longitude: number | null }>({
    latitude: null,
    longitude: null,
  });
  const [isVerifyingLocation, setIsVerifyingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    function handleSaved(event: Event) {
      const detail = (event as CustomEvent<SavedPollingUnit | null>).detail;
      const joined = window.localStorage.getItem("get-involved:joined-polling-unit-id");
      if (joined && (!detail || detail.id !== joined)) {
        return;
      }
      setSavedUnit(detail ?? null);
    }
    window.addEventListener("polling-unit-saved", handleSaved as EventListener);
    return () => {
      window.removeEventListener("polling-unit-saved", handleSaved as EventListener);
      if (onPostedTimerRef.current !== null) {
        window.clearTimeout(onPostedTimerRef.current);
        onPostedTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = readOrMintSessionToken();
    }

    if (!savedUnit) {
      setPosterLabel(null);
      setAlreadyJoined(false);
      setEligibilityLoading(false);
      return;
    }

    let cancelled = false;
    setEligibilityLoading(true);
    setLocationError(null);

    void checkJoinEligibility({
      pu_id: savedUnit.id,
      session_token: sessionTokenRef.current,
    }).then((res) => {
      if (cancelled) return;
      setEligibilityLoading(false);
      if (res.ok) {
        setAlreadyJoined(res.alreadyJoined);
        setJoinEnabled(res.joinEnabled);
        setPuCoords({ latitude: res.latitude, longitude: res.longitude });

        if (res.alreadyJoined && res.posterLabel) {
          setPosterLabel(res.posterLabel);

          const activePuId = res.pollingUnitDetails?.id || savedUnit.id;
          if (activePuId) {
            window.localStorage.setItem("get-involved:joined-polling-unit-id", activePuId);
          }

          if (res.pollingUnitDetails && res.pollingUnitDetails.id !== savedUnit.id) {
            const restoredUnit: SavedPollingUnit = {
              id: res.pollingUnitDetails.id,
              pollingUnitCode: res.pollingUnitDetails.pollingUnitCode,
              pollingUnitName: res.pollingUnitDetails.pollingUnitName,
              ward: res.pollingUnitDetails.ward,
              lga: res.pollingUnitDetails.lga,
              state: res.pollingUnitDetails.state,
              savedAt: new Date().toISOString(),
            };
            setSavedUnit(restoredUnit);
            window.localStorage.setItem(SAVED_POLLING_UNIT_KEY, JSON.stringify(restoredUnit));
            window.dispatchEvent(new CustomEvent("polling-unit-saved", { detail: restoredUnit }));
          }
        } else {
          setPosterLabel(null);
        }
      } else {
        setLocationError(res.error ?? "Failed to check joining eligibility.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [savedUnit]);

  async function handleJoin() {
    if (!savedUnit || !sessionTokenRef.current) return;

    const confirmationMessage = "Are you sure you want to join this polling unit? Once you join, you will not be able to save or join a new polling unit on this device for this election.";
    if (!window.confirm(confirmationMessage)) {
      return;
    }

    setIsVerifyingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setIsVerifyingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: userLat, longitude: userLon } = position.coords;
        const { latitude: puLat, longitude: puLon } = puCoords;

        if (puLat === null || puLon === null) {
          setLocationError("Polling unit coordinates are missing. Location verification cannot be completed.");
          setIsVerifyingLocation(false);
          return;
        }

        const distance = calculateDistanceMeters(userLat, userLon, puLat, puLon);

        const isDevelopment = process.env.NODE_ENV !== "production" || (typeof window !== "undefined" && window.location.hostname === "localhost");
        if (distance > MAX_JOIN_RADIUS_METERS && !isDevelopment) {
          const distanceKm = (distance / 1000).toFixed(2);
          setLocationError(
            `You are ${distanceKm} km away. You must be physically at the location (within 1 km) to join.`
          );
          setIsVerifyingLocation(false);
          return;
        }

        try {
          const res = await getOrMintPosterLabel({
            pu_id: savedUnit.id,
            session_token: sessionTokenRef.current,
          });

          if (res.ok) {
            setPosterLabel(res.poster_label);
            setAlreadyJoined(true);
            window.localStorage.setItem("get-involved:joined-polling-unit-id", savedUnit.id);
            window.dispatchEvent(
              new CustomEvent("polling-unit-joined", { detail: { pu_id: savedUnit.id } })
            );
          } else {
            setLocationError(res.error ?? "Failed to join polling unit.");
          }
        } catch (err) {
          setLocationError("Could not complete join process. Please try again.");
        } finally {
          setIsVerifyingLocation(false);
        }
      },
      (error) => {
        setIsVerifyingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(
              "Location permission denied. Please enable location access in your browser settings to verify you are at the polling unit."
            );
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Position unavailable. Please check your GPS connection and try again.");
            break;
          case error.TIMEOUT:
            setLocationError("Location check timed out. Please check your GPS and try again.");
            break;
          default:
            setLocationError("Could not retrieve your location. Please check your settings and try again.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: LOCATION_CHECK_TIMEOUT_MS,
        maximumAge: 0,
      }
    );
  }

  useEffect(() => {
    if (!savedUnit) {
      setCandidates([]);
      setSelectedId(null);
      return;
    }

    const trimmed = body.trim();
    if (selectedId) {
      const selected = candidates.find((c) => c.id === selectedId);
      if (selected && selected.summary === trimmed) {
        return;
      }
    }
    if (trimmed.length < MIN_SEARCH_LENGTH) {
      if (trimmed.length === 0) {
        setCandidates(BASE_SUGGESTIONS);
      } else {
        const lower = trimmed.toLowerCase();
        const filtered = BASE_SUGGESTIONS.filter((s) =>
          s.summary.toLowerCase().includes(lower)
        );
        setCandidates(filtered.length > 0 ? filtered : BASE_SUGGESTIONS);
      }
      setSelectedId((current) => {
        if (current && BASE_SUGGESTIONS.some((s) => s.id === current)) return current;
        return null;
      });
      return;
    }

    setIsFetching(true);
    const timer = window.setTimeout(async () => {
      try {
        const suggestions = await suggestSummaries(trimmed);
        const lower = trimmed.toLowerCase();
        const matchingBase = BASE_SUGGESTIONS.filter((s) =>
          s.summary.toLowerCase().includes(lower)
        );

        const combined = [...suggestions];
        for (const base of matchingBase) {
          if (!combined.some((s) => s.id === base.id)) {
            combined.push(base);
          }
        }

        const finalSuggestions = combined.length > 0 ? combined : BASE_SUGGESTIONS;

        setCandidates(finalSuggestions);
        setSelectedId((current) => {
          if (current && finalSuggestions.some((s) => s.id === current)) return current;
          return null;
        });
      } finally {
        setIsFetching(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [body, savedUnit]);

  const canSubmit = Boolean(
    savedUnit &&
    body.trim().length >= 4 &&
    body.trim().length <= 30 &&
    selectedId &&
    state.kind !== "submitting",
  );

  async function handleSubmit() {
    if (!canSubmit || !selectedId || !savedUnit) return;
    const picked = candidates.find((c) => c.id === selectedId);
    if (!picked) return;

    setState({ kind: "submitting" });
    try {
      const tag = getAutomaticTag(picked.id);
      const result = await publishFeedPost({
        pu_id: savedUnit.id,
        body: picked.summary,
        summary: tag,
        session_token: sessionTokenRef.current,
      });
      if (result.ok) {
        setState({ kind: "ok", posterLabel: result.poster_label });
        setPosterLabel(result.poster_label);
        setBody("");
        setCandidates([]);
        setSelectedId(null);
        window.dispatchEvent(
          new CustomEvent("feed-post-published", { detail: { pu_id: savedUnit.id } }),
        );
        if (onPosted) {
          if (onPostedTimerRef.current !== null) {
            window.clearTimeout(onPostedTimerRef.current);
          }
          onPostedTimerRef.current = window.setTimeout(() => {
            onPostedTimerRef.current = null;
            onPosted();
          }, 700);
        }
      } else {
        setState({ kind: "error", message: result.error });
      }
    } catch (err) {
      setState({
        kind: "error",
        message:
          err instanceof Error ? err.message : "Could not save your update. Try again.",
      });
    }
  }

  if (!savedUnit) {
    return (
      <div className="post-composer post-composer--gated" role="status">
        <p className="ds-eyebrow ds-eyebrow--accent">Save a polling unit to post</p>
        <p className="post-composer__gate-copy">
          Updates here are anchored to a specific polling unit you have saved on
          this device. Pick a unit from the directory, save it on its profile
          page, and the composer comes alive here.
        </p>
        <button
          type="button"
          className="ds-button ds-button--primary"
          onClick={navigateToDirectory}
        >
          Open the polling-unit directory
        </button>
      </div>
    );
  }

  if (eligibilityLoading) {
    return (
      <div className="post-composer post-composer--gated" role="status">
        <p className="ds-eyebrow ds-eyebrow--accent">Checking eligibility</p>
        <p className="post-composer__gate-copy">
          Verifying your access to this polling unit's feed...
        </p>
      </div>
    );
  }

  if (!alreadyJoined) {
    if (!joinEnabled) {
      return (
        <div className="post-composer post-composer--gated" role="status">
          <header className="post-composer__head">
            <p className="ds-eyebrow ds-eyebrow--accent">Posting live updates is currently closed</p>
            <p className="post-composer__anchor">
              {savedUnit.pollingUnitName} · {savedUnit.ward}, {savedUnit.lga}, {savedUnit.state}
            </p>
          </header>
          <p className="post-composer__gate-copy">
            Posting live updates is currently closed. It will be open on Election Day.
          </p>
        </div>
      );
    }

    return (
      <div className="post-composer post-composer--gated" role="status">
        <header className="post-composer__head">
          <p className="ds-eyebrow ds-eyebrow--accent">Join Polling Unit</p>
          <p className="post-composer__anchor">
            {savedUnit.pollingUnitName} · {savedUnit.ward}, {savedUnit.lga}, {savedUnit.state}
          </p>
        </header>
        <p className="post-composer__gate-copy">
          To report observations from this polling unit, you must verify your device is physically at the location (within 1 km).
        </p>
        <button
          type="button"
          className="ds-button ds-button--primary"
          onClick={handleJoin}
          disabled={isVerifyingLocation}
        >
          {isVerifyingLocation ? "Verifying Location..." : "Verify Location & Join"}
        </button>
        {locationError && (
          <p className="post-composer__status post-composer__status--error" role="alert">
            {locationError}
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      className="post-composer"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
    >
      <header className="post-composer__head">
        <p className="ds-eyebrow ds-eyebrow--accent">
          Update from PU {savedUnit.pollingUnitCode || savedUnit.id}
          {posterLabel ? ` · you'll post as ${posterLabel}` : null}
        </p>
        <p className="post-composer__anchor">
          {savedUnit.pollingUnitName} · {savedUnit.ward}, {savedUnit.lga}, {savedUnit.state}
        </p>
      </header>

      <label className="post-composer__field" htmlFor="post-composer-body">
        <span className="ds-eyebrow post-composer__label">What's happening</span>
        <textarea
          className="post-composer__input"
          id="post-composer-body"
          maxLength={30}
          minLength={4}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Voting has started"
          rows={2}
          value={body}
        />
        <span className="post-composer__counter" aria-live="polite">
          {body.trim().length}/30
        </span>
      </label>

      <div className="post-composer__field">
        <span className="ds-eyebrow post-composer__label">Pick one summary</span>
        <div className="post-composer__suggestions" aria-busy={isFetching ? "true" : "false"}>
          {candidates.length === 0 ? (
            <p className="post-composer__empty">
              {isFetching ? "Matching…" : ""}
            </p>
          ) : (
            <ul className="post-composer__chips" role="radiogroup">
              {candidates.map((c) => {
                const isSelected = c.id === selectedId;
                return (
                  <li key={c.id}>
                    <button
                      aria-checked={isSelected}
                      className={`post-composer__chip${isSelected ? " is-selected" : ""}${c.id.startsWith("novel-") ? " is-novel" : ""
                        }`}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedId(null);
                          setBody("");
                        } else {
                          setSelectedId(c.id);
                          setBody(c.summary);
                        }
                      }}
                      role="radio"
                      type="button"
                    >
                      {c.summary}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="post-composer__actions">
        <button
          className="ds-button ds-button--ghost"
          disabled={state.kind === "submitting" || body.length === 0}
          onClick={() => {
            setBody("");
            setCandidates([]);
            setSelectedId(null);
            setState({ kind: "idle" });
          }}
          type="button"
        >
          Reset
        </button>
        <button
          className="ds-button ds-button--primary"
          disabled={!canSubmit}
          type="submit"
        >
          {state.kind === "submitting" ? "Posting…" : "Post update"}
        </button>
      </div>

      {state.kind === "ok" ? (
        <p className="post-composer__status post-composer__status--ok" role="status">
          Posted as {state.posterLabel}.
        </p>
      ) : null}

      {state.kind === "error" ? (
        <p className="post-composer__status post-composer__status--error" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
