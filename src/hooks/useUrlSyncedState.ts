import { useEffect, useRef, useState } from "react";

type Parser<T> = (params: URLSearchParams) => T;
type Serializer<T> = (value: T) => URLSearchParams;

export function useUrlSyncedState<T>(options: {
  parse: Parser<T>;
  serialize: Serializer<T>;
  toPath: (queryString: string) => string;
}) {
  const parseRef = useRef(options.parse);
  const serializeRef = useRef(options.serialize);
  const toPathRef = useRef(options.toPath);

  parseRef.current = options.parse;
  serializeRef.current = options.serialize;
  toPathRef.current = options.toPath;

  const [value, setValue] = useState<T>(() =>
    parseRef.current(new URLSearchParams(window.location.search)),
  );

  useEffect(() => {
    const params = serializeRef.current(value);
    const queryString = params.toString();
    const nextSearch = queryString ? `?${queryString}` : "";
    if (window.location.search === nextSearch) return;

    window.history.replaceState({}, "", toPathRef.current(queryString));
  }, [value]);

  return { value, setValue };
}
