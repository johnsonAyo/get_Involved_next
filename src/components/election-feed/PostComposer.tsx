"use client";


import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getOrMintPosterLabel,
  publishFeedPost,
  suggestSummaries,
} from "@/app/actions/feed";
import type { MatchedSummary } from "@/lib/summary-matcher";

const SAVED_POLLING_UNIT_KEY = "get-involved:saved-polling-unit";
const FEED_SESSION_KEY = "get-involved:feed-session";
const PANEL_OPEN_STORAGE_KEY = "get-involved:election-feed-open";

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

const UUID_PROBE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  const [savedUnit, setSavedUnit] = useState<SavedPollingUnit | null>(null);
  const [body, setBody] = useState("");
  const [candidates, setCandidates] = useState<MatchedSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [posterLabel, setPosterLabel] = useState<string | null>(null);
  const [state, setState] = useState<ComposerState>({ kind: "idle" });
  const [isFetching, setIsFetching] = useState(false);
  const sessionTokenRef = useRef<string>("");
  const onPostedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (onPostedTimerRef.current !== null) {
        window.clearTimeout(onPostedTimerRef.current);
        onPostedTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setSavedUnit(readSavedPollingUnit());

    function handleSaved(event: Event) {
      setSavedUnit(
        (event as CustomEvent<SavedPollingUnit | null>).detail ?? null,
      );
    }
    window.addEventListener("polling-unit-saved", handleSaved as EventListener);
    return () => window.removeEventListener("polling-unit-saved", handleSaved as EventListener);
  }, []);

  useEffect(() => {
    sessionTokenRef.current = readOrMintSessionToken();
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!savedUnit) {
      setPosterLabel(null);
      return;
    }
    if (!sessionTokenRef.current || !UUID_PROBE.test(sessionTokenRef.current)) {
      return;
    }

    void getOrMintPosterLabel({
      pu_id: savedUnit.id,
      session_token: sessionTokenRef.current,
    }).then((res) => {
      if (cancelled) return;
      if (res.ok) setPosterLabel(res.poster_label);
    });

    return () => {
      cancelled = true;
    };
  }, [savedUnit]);

  useEffect(() => {
    const trimmed = body.trim();
    if (trimmed.length < 4 || !savedUnit) {
      setCandidates([]);
      setSelectedId(null);
      return;
    }
    setIsFetching(true);
    const timer = window.setTimeout(async () => {
      try {
        const suggestions = await suggestSummaries(trimmed);
        setCandidates(suggestions);
        setSelectedId((current) => {
          if (current && suggestions.some((s) => s.id === current)) return current;
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
      const result = await publishFeedPost({
        pu_id: savedUnit.id,
        body: body.trim(),
        summary: picked.summary,
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
              {isFetching
                ? "Matching…"
                : "Type at least 4 characters to see suggested summaries."}
            </p>
          ) : (
            <ul className="post-composer__chips" role="radiogroup">
              {candidates.map((c) => {
                const isSelected = c.id === selectedId;
                return (
                  <li key={c.id}>
                    <button
                      aria-checked={isSelected}
                      className={`post-composer__chip${isSelected ? " is-selected" : ""}${
                        c.id.startsWith("novel-") ? " is-novel" : ""
                      }`}
                      onClick={() => setSelectedId(isSelected ? null : c.id)}
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
