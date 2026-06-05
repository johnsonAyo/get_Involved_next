"use client";

import { useMemo, useState } from "react";
import { NIGERIA_STATES_SVG } from "@/data/nigeriaStatesSvg";

type Props = {
  activeStateId?: string | null;
  className?: string;
  onSelectState?: (stateId: string) => void;
  previewStateId?: string | null;
};

export function NigeriaStatesMap({
  activeStateId = null,
  previewStateId = null,
  className = "",
  onSelectState,
}: Props) {
  const [hoverStateId, setHoverStateId] = useState<string | null>(null);
  const focusStateId = hoverStateId ?? previewStateId;

  const focusState = useMemo(() => {
    if (!focusStateId) return null;
    return NIGERIA_STATES_SVG.states.find((state) => state.id === focusStateId) ?? null;
  }, [focusStateId]);

  const selectedState = useMemo(() => {
    if (!activeStateId) return null;
    return NIGERIA_STATES_SVG.states.find((state) => state.id === activeStateId) ?? null;
  }, [activeStateId]);

  const feedback = useMemo(() => {
    if (focusState && focusState.id !== activeStateId) {
      return `${focusState.name} — click to select`;
    }
    if (selectedState) {
      return `Viewing ${selectedState.name}`;
    }
    return "Hover a state to preview. Click to open.";
  }, [activeStateId, focusState, selectedState]);

  return (
    <div className={`nigeria-states-map ${className}`.trim()}>
      <svg
        aria-label="Nigeria states map"
        className="nigeria-states-map__svg"
        role="img"
        viewBox={NIGERIA_STATES_SVG.viewBox}
        xmlns="http://www.w3.org/2000/svg"
      >
        <g className="nigeria-states-map__states">
          {NIGERIA_STATES_SVG.states.map((state) => {
            const isSelected = state.id === activeStateId;
            const isFocused = focusStateId === state.id && !isSelected;

            return (
              <path
                key={state.id}
                className={[
                  "nigeria-states-map__state",
                  isSelected ? "nigeria-states-map__state--selected" : "",
                  isFocused ? "nigeria-states-map__state--focused" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                d={state.d}
                onClick={() => onSelectState?.(state.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectState?.(state.id);
                  }
                }}
                onMouseEnter={() => setHoverStateId(state.id)}
                onMouseLeave={() => setHoverStateId(null)}
                role="button"
                tabIndex={0}
              >
                <title>{state.name}</title>
              </path>
            );
          })}
        </g>
      </svg>

      <p aria-live="polite" className="ds-meta nigeria-states-map__feedback">
        {feedback}
      </p>
    </div>
  );
}
