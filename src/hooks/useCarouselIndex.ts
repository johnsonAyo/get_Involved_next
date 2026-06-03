import { useEffect, useState } from "react";

type Options = {
  delayMs: number;
  length: number;
};

export function useCarouselIndex({ delayMs, length }: Options) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!length) return undefined;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % length);
    }, delayMs);

    return () => window.clearInterval(timer);
  }, [delayMs, length]);

  return { index, setIndex };
}

