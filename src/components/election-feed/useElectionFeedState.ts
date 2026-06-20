"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CIVIC_TEMPLATES,
  ElectionFeedFilters,
  ElectionFeedLgaOption,
  ElectionFeedMessage,
  ElectionFeedPollingUnitOption,
  ElectionFeedStateOption,
  ElectionFeedWardOption,
  INITIAL_MESSAGES,
  POSTER_HANDLES,
} from "./mockMessages";
import type { GeoState, GeoPollingUnit } from "@/app/actions/polling-units";
import {
  getPollingUnitLgas,
  getPollingUnitWards,
  getPollingUnitsForWard,
} from "@/app/actions/polling-units";

const MAX_VISIBLE_MESSAGES = 40;
const MIN_CADENCE_MS = 9000;
const MAX_CADENCE_MS = 14000;

const STALE_TIME_MS = 5 * 60 * 1000;

const normalize = (s: string) => s.toLowerCase().trim();

export function useElectionFeedState({
  enabled,
  states,
}: {
  enabled: boolean;
  states: GeoState[];
}) {
  const stateOptions = useMemo<ElectionFeedStateOption[]>(
    () =>
      [...states]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((s) => ({ value: s.id, label: s.name })),
    [states],
  );

  const [filters, setFiltersState] = useState<ElectionFeedFilters>({
    state: "",
    lga: "",
    ward: "",
    pollingUnit: "",
  });

  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const lgasQuery = useQuery({
    queryKey: ["polling-unit-lgas", filters.state],
    queryFn: () => getPollingUnitLgas(filters.state),
    enabled: !!filters.state && enabled,
    staleTime: STALE_TIME_MS,
  });

  const wardsQuery = useQuery({
    queryKey: ["polling-unit-wards", filters.state, filters.lga],
    queryFn: () => getPollingUnitWards(filters.state, filters.lga),
    enabled: !!filters.state && !!filters.lga && enabled,
    staleTime: STALE_TIME_MS,
  });

  const pusQuery = useQuery({
    queryKey: [
      "polling-unit-pus",
      filters.state,
      filters.lga,
      filters.ward,
    ],
    queryFn: () =>
      getPollingUnitsForWard(filters.state, filters.lga, filters.ward),
    enabled:
      !!filters.state && !!filters.lga && !!filters.ward && enabled,
    staleTime: STALE_TIME_MS,
  });

  const [messages, setMessages] = useState<ElectionFeedMessage[]>(
    () => [...INITIAL_MESSAGES].sort(byPostedAtAsc),
  );

  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!enabled) return undefined;

    const queueNext = () => {
      const delay =
        MIN_CADENCE_MS +
        Math.floor(Math.random() * (MAX_CADENCE_MS - MIN_CADENCE_MS));
      intervalRef.current = setTimeout(() => {
        setMessages((current) =>
          pushNextMessage(current, filtersRef.current),
        );
        queueNext();
      }, delay);
    };
    queueNext();

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled]);

  const setFilter = useCallback(
    <K extends keyof ElectionFeedFilters>(
      key: K,
      value: ElectionFeedFilters[K],
    ) => {
      setFiltersState((prev) => {
        const next: ElectionFeedFilters = { ...prev, [key]: value };

        if (key === "state") {
          next.lga = "";
          next.ward = "";
          next.pollingUnit = "";
        } else if (key === "lga") {
          next.ward = "";
          next.pollingUnit = "";
        } else if (key === "ward") {
          next.pollingUnit = "";
        }

        return next;
      });
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFiltersState({ state: "", lga: "", ward: "", pollingUnit: "" });
  }, []);

  const lgaOptions = useMemo<ElectionFeedLgaOption[]>(
    () =>
      (lgasQuery.data ?? []).map((name) => ({
        value: name,
        label: name,
      })),
    [lgasQuery.data],
  );

  const wardOptions = useMemo<ElectionFeedWardOption[]>(
    () =>
      (wardsQuery.data ?? []).map((name) => ({
        value: name,
        label: name,
      })),
    [wardsQuery.data],
  );

  const pollingUnitOptions = useMemo<ElectionFeedPollingUnitOption[]>(
    () =>
      (pusQuery.data ?? []).map((pu: GeoPollingUnit) => ({
        value: pu.name,
        label: pu.code ? `${pu.name} (${pu.code})` : pu.name,
      })),
    [pusQuery.data],
  );

  const normalisedFilters = useMemo<ElectionFeedFilters>(() => {
    if (
      filters.state &&
      !stateOptions.some((o) => o.value === filters.state)
    ) {
      return { state: "", lga: "", ward: "", pollingUnit: "" };
    }
    if (filters.lga && !lgaOptions.some((o) => o.value === filters.lga)) {
      return { ...filters, lga: "", ward: "", pollingUnit: "" };
    }
    if (filters.ward && !wardOptions.some((o) => o.value === filters.ward)) {
      return { ...filters, ward: "", pollingUnit: "" };
    }
    if (
      filters.pollingUnit &&
      !pollingUnitOptions.some((o) => o.value === filters.pollingUnit)
    ) {
      return { ...filters, pollingUnit: "" };
    }
    return filters;
  }, [filters, stateOptions, lgaOptions, wardOptions, pollingUnitOptions]);

  const visibleMessages = useMemo(
    () => filterMessages(messages, normalisedFilters).sort(byPostedAtAsc),
    [messages, normalisedFilters],
  );

  return {
    messages,
    visibleMessages,
    filters: normalisedFilters,
    filterOptions: {
      state: stateOptions,
      lga: lgaOptions,
      ward: wardOptions,
      pollingUnit: pollingUnitOptions,
    },
    loadingOptions: {
      states: states.length === 0,
      lga: lgasQuery.isFetching,
      ward: wardsQuery.isFetching,
      pollingUnit: pusQuery.isFetching,
    },
    setFilter,
    resetFilters,
  };
}

export type ElectionFeedStateFilterOptions = ReturnType<
  typeof useElectionFeedState
>["filterOptions"];

export type ElectionFeedStateLoadingOptions = ReturnType<
  typeof useElectionFeedState
>["loadingOptions"];

function byPostedAtAsc(a: ElectionFeedMessage, b: ElectionFeedMessage) {
  return new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime();
}

function filterMessages(
  messages: ElectionFeedMessage[],
  filters: ElectionFeedFilters,
): ElectionFeedMessage[] {
  if (
    !filters.state &&
    !filters.lga &&
    !filters.ward &&
    !filters.pollingUnit
  ) {
    return messages;
  }

  const sN = normalize(filters.state);
  const lN = normalize(filters.lga);
  const wN = normalize(filters.ward);
  const pN = normalize(filters.pollingUnit);

  return messages.filter((msg) => {
    if (sN && normalize(msg.anchor.stateSlug) !== sN) return false;
    if (lN && normalize(msg.anchor.lga) !== lN) return false;
    if (wN && normalize(msg.anchor.ward) !== wN) return false;
    if (pN && normalize(msg.anchor.pollingUnitName) !== pN) return false;
    return true;
  });
}

function pushNextMessage(
  current: ElectionFeedMessage[],
  filters: ElectionFeedFilters,
): ElectionFeedMessage[] {
  const visibleScope = filterMessages(current, filters);
  const anchorPool =
    visibleScope.length > 0
      ? visibleScope.map((m) => m.anchor)
      : filterMessages(current, {
          state: "",
          lga: "",
          ward: "",
          pollingUnit: "",
        }).map((m) => m.anchor);
  if (anchorPool.length === 0) return current;

  const template =
    CIVIC_TEMPLATES[Math.floor(Math.random() * CIVIC_TEMPLATES.length)];
  const anchor = anchorPool[Math.floor(Math.random() * anchorPool.length)];
  const poster =
    POSTER_HANDLES[Math.floor(Math.random() * POSTER_HANDLES.length)];

  const id = `live-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const next: ElectionFeedMessage = {
    id,
    poster,
    postedAt: new Date().toISOString(),
    anchor,
    text: template.text,
    tags: template.tags,
  };

  const appended = [...current, next];
  if (appended.length > MAX_VISIBLE_MESSAGES) {
    return appended.slice(-MAX_VISIBLE_MESSAGES);
  }
  return appended;
}
