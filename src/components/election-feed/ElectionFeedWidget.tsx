"use client";

import { useEffect, useState } from "react";
import { ElectionFeedFab } from "./ElectionFeedFab";
import { ComposeFab } from "./ComposeFab";
import { ElectionFeedPanel, type ElectionFeedMode } from "./ElectionFeedPanel";
import { useElectionFeedState } from "./useElectionFeedState";
import type { GeoState } from "@/app/actions/polling-units";

type Props = {
  states: GeoState[];
};

export function ElectionFeedWidget({ states }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ElectionFeedMode>("read");
  const [isHydrated, setIsHydrated] = useState(false);

  const feed = useElectionFeedState({ enabled: true, states });

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PANEL_OPEN_STORAGE_KEY);
      if (stored === "1") setIsOpen(true);
      const storedMode = window.localStorage.getItem(PANEL_MODE_STORAGE_KEY);
      if (storedMode === "read" || storedMode === "compose") {
        setMode(storedMode);
      }
    } catch {
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(
        PANEL_OPEN_STORAGE_KEY,
        isOpen ? "1" : "0",
      );
      window.localStorage.setItem(
        PANEL_MODE_STORAGE_KEY,
        mode,
      );
    } catch {
    }
  }, [isOpen, mode, isHydrated]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const mq = window.matchMedia("(max-width: 60rem)");
    if (mq.matches) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  function close() {
    setIsOpen(false);
  }

  return (
    <div className="election-feed">
      {isOpen ? (
        mode === "read" ? (
          <ElectionFeedPanel
            mode="read"
            onClose={close}
            visibleMessages={feed.visibleMessages}
            filters={feed.filters}
            filterOptions={feed.filterOptions}
            loadingOptions={feed.loadingOptions}
            setFilter={feed.setFilter}
            resetFilters={feed.resetFilters}
          />
        ) : (
          <ElectionFeedPanel mode="compose" onClose={close} />
        )
      ) : (
        <>
          <ElectionFeedFab
            onClick={() => {
              if (isHydrated) {
                setMode("read");
                setIsOpen(true);
              }
            }}
          />
          <ComposeFab
            onClick={() => {
              if (isHydrated) {
                setMode("compose");
                setIsOpen(true);
              }
            }}
          />
        </>
      )}
    </div>
  );
}

const PANEL_OPEN_STORAGE_KEY = "get-involved:election-feed-open";
const PANEL_MODE_STORAGE_KEY = "get-involved:election-feed-mode";
