"use client";

import { useEffect, useRef } from "react";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import {
  ACTIVE_ELECTION,
  type ElectionFeedMessage as ElectionFeedPost,
  type ElectionFeedFilters as ElectionFeedFilterValues,
} from "./mockMessages";
import type {
  ElectionFeedStateFilterOptions,
  ElectionFeedStateLoadingOptions,
} from "./useElectionFeedState";
import { ElectionFeedMessage } from "./ElectionFeedMessage";
import { ElectionFeedFilters } from "./ElectionFeedFilters";
import { PostComposer } from "./PostComposer";

export type ElectionFeedMode = "read" | "compose";

type ReadProps = {
  mode: "read";
  onClose: () => void;
  visibleMessages: ElectionFeedPost[];
  filters: ElectionFeedFilterValues;
  filterOptions: ElectionFeedStateFilterOptions;
  loadingOptions: ElectionFeedStateLoadingOptions;
  setFilter: <K extends keyof ElectionFeedFilterValues>(
    key: K,
    value: ElectionFeedFilterValues[K],
  ) => void;
  resetFilters: () => void;
};

type ComposeProps = {
  mode: "compose";
  onClose: () => void;
};

type Props = ReadProps | ComposeProps;

export function ElectionFeedPanel(props: Props) {
  const { mode, onClose } = props;
  const listRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  const visibleMessages = mode === "read" ? props.visibleMessages : [];
  useIsomorphicLayoutEffect(() => {
    if (mode !== "read") return;
    const list = listRef.current;
    if (!list) return;
    const newestId = visibleMessages.at(-1)?.id ?? null;
    if (lastMessageIdRef.current === newestId) return;

    const wasNearBottom =
      list.scrollHeight - list.scrollTop - list.clientHeight < 64;

    list.scrollTop = Math.min(list.scrollTop, list.scrollHeight);

    if (wasNearBottom || lastMessageIdRef.current === null) {
      list.scrollTop = list.scrollHeight;
    }
    lastMessageIdRef.current = newestId;
  }, [mode, visibleMessages]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (!panelRef.current) return;
      if (panelRef.current.contains(target)) return;
      event.preventDefault();
      onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [onClose]);

  const newestId = mode === "read" ? visibleMessages.at(-1)?.id : undefined;

  return (
    <section
      ref={panelRef}
      className="election-feed__panel"
      aria-label={
        mode === "compose" ? "Post a polling-unit update" : "Election Watch feed"
      }
      data-mode={mode}
    >
      <header className="election-feed__panel-header">
        <div className="election-feed__panel-header-text">
          {mode === "read" ? (
            <>
              <p className="ds-eyebrow ds-eyebrow--accent election-feed__panel-eyebrow">
                <span className="election-feed__panel-dot" aria-hidden="true" />
                Live · {ACTIVE_ELECTION.type}
              </p>
              <h2 className="election-feed__panel-title">
                {ACTIVE_ELECTION.state}
                <span className="election-feed__panel-date">
                  {" "}
                  · {ACTIVE_ELECTION.date}
                </span>
              </h2>
            </>
          ) : (
            <>
              <p className="ds-eyebrow ds-eyebrow--accent election-feed__panel-eyebrow">
                <span
                  className="election-feed__panel-dot"
                  aria-hidden="true"
                />
                Anonymous update
              </p>
              <h2 className="election-feed__panel-title">Give an update</h2>
            </>
          )}
        </div>
        <button
          type="button"
          className="election-feed__panel-close"
          aria-label={mode === "compose" ? "Close composer" : "Close election feed"}
          onClick={onClose}
        >
          <span aria-hidden="true" className="election-feed__panel-close-icon">
            ×
          </span>
        </button>
      </header>

      {mode === "read" ? (
        <ReadBody
          visibleMessages={mode === "read" ? props.visibleMessages : []}
          newestId={newestId}
          listRef={listRef}
          filters={mode === "read" ? props.filters : undefined}
          filterOptions={mode === "read" ? props.filterOptions : undefined}
          loadingOptions={mode === "read" ? props.loadingOptions : undefined}
          setFilter={mode === "read" ? props.setFilter : undefined}
          resetFilters={mode === "read" ? props.resetFilters : undefined}
        />
      ) : (
        <div className="election-feed__compose-body">
          <PostComposer onPosted={onClose} />
        </div>
      )}
    </section>
  );
}

type ReadBodyProps = {
  visibleMessages: ElectionFeedPost[];
  newestId: string | undefined;
  listRef: React.RefObject<HTMLDivElement | null>;
  filters: ElectionFeedFilterValues | undefined;
  filterOptions: ElectionFeedStateFilterOptions | undefined;
  loadingOptions: ElectionFeedStateLoadingOptions | undefined;
  setFilter:
    | (<K extends keyof ElectionFeedFilterValues>(
        key: K,
        value: ElectionFeedFilterValues[K],
      ) => void)
    | undefined;
  resetFilters: (() => void) | undefined;
};

function ReadBody({
  visibleMessages,
  newestId,
  listRef,
  filters,
  filterOptions,
  loadingOptions,
  setFilter,
  resetFilters,
}: ReadBodyProps) {
  if (
    !filters ||
    !filterOptions ||
    !loadingOptions ||
    !setFilter ||
    !resetFilters
  ) {
    return null;
  }
  return (
    <>
      <ElectionFeedFilters
        filters={filters}
        options={filterOptions}
        loading={loadingOptions}
        onChange={setFilter}
        onReset={resetFilters}
      />

      <div
        ref={listRef}
        className="election-feed__list"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Live election updates"
      >
        {visibleMessages.length === 0 ? (
          <p className="election-feed__empty">
            No updates from this polling unit yet. The polling unit feed
            keeps running while you watch — refreshed as citizens post.
          </p>
        ) : (
          <div className="election-feed__list-items">
            {visibleMessages.map((msg) => (
              <ElectionFeedMessage
                key={msg.id}
                msg={msg}
                isNewest={msg.id === newestId}
              />
            ))}
          </div>
        )}
      </div>

      <footer className="election-feed__panel-footer">
        <span
          className="election-feed__panel-count"
          aria-label={`${visibleMessages.length} updates in the live feed`}
        >
          {visibleMessages.length} update{visibleMessages.length === 1 ? "" : "s"}
        </span>
        <span className="election-feed__panel-meta">
          Updates posted to a specific polling unit. Posting arrives in a
          follow-up slice.
        </span>
      </footer>
    </>
  );
}
