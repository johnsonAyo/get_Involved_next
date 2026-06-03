import { useEffect, useState } from "react";

type Options = {
  delayMs: number;
  length: number;
};

export function useCarouselIndex({ delayMs, length }: Options) {
  const [index, setIndex] = useState(0);
  const [lastInteraction, setLastInteraction] = useState(Date.now());

  useEffect(() => {
    if (!length) return undefined;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % length);
    }, delayMs);

    return () => window.clearInterval(timer);
  }, [delayMs, length, lastInteraction]);

  const setIndexWithInteraction = (newIndex: number | ((current: number) => number)) => {
    setIndex(newIndex);
    setLastInteraction(Date.now());
  };

  return { index, setIndex: setIndexWithInteraction };
}

