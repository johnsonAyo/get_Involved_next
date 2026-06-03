import { useEffect, useMemo, useState } from "react";

type Options = {
  itemCount: number;
  pageSize: number;
  resetDependencies?: unknown[];
};

export function usePagination({
  itemCount,
  pageSize,
  resetDependencies = [],
}: Options) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(itemCount / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, resetDependencies);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, pageCount));
  }, [pageCount]);

  const pageNumbers = useMemo(
    () => Array.from({ length: pageCount }, (_, index) => index + 1),
    [pageCount],
  );

  const firstItemIndex = (currentPage - 1) * pageSize;

  return {
    currentPage,
    firstItemIndex,
    pageCount,
    pageNumbers,
    setCurrentPage,
  };
}
