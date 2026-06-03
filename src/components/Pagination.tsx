type Props = {
  currentPage: number;
  onPageChange: (page: number) => void;
  pageCount: number;
  pageNumbers: number[];
};

export function Pagination({
  currentPage,
  onPageChange,
  pageCount,
  pageNumbers,
}: Props) {
  if (pageCount <= 1) return null;

  const visiblePages: (number | string)[] = [];
  const maxPagesWithoutTruncation = 7;

  if (pageCount <= maxPagesWithoutTruncation) {
    for (let i = 1; i <= pageCount; i++) {
      visiblePages.push(i);
    }
  } else {
    const delta = 1;
    for (let i = 1; i <= pageCount; i++) {
      if (
        i === 1 ||
        i === pageCount ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        visiblePages.push(i);
      } else if (
        (i === currentPage - delta - 1 && i > 1) ||
        (i === currentPage + delta + 1 && i < pageCount)
      ) {
        visiblePages.push("...");
      }
    }
  }

  return (
    <nav aria-label="Candidate directory pages" className="pagination">
      <p aria-live="polite" className="ds-meta pagination__status">
        Page {String(currentPage).padStart(2, "0")} of{" "}
        {String(pageCount).padStart(2, "0")}
      </p>
      <div className="pagination__controls">
        <button
          className="pagination__direction"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          type="button"
        >
          ← Previous
        </button>
        <div className="pagination__pages">
          {visiblePages.map((page, index) => {
            if (typeof page === "string") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "2.75rem",
                    height: "2.75rem",
                    color: "var(--ds-color-ink-muted)",
                    fontWeight: 700,
                  }}
                >
                  {page}
                </span>
              );
            }
            return (
              <button
                aria-current={page === currentPage ? "page" : undefined}
                aria-label={`Page ${page}`}
                className="pagination__page"
                key={page}
                onClick={() => onPageChange(page)}
                type="button"
              >
                {String(page).padStart(2, "0")}
              </button>
            );
          })}
        </div>
        <button
          className="pagination__direction"
          disabled={currentPage === pageCount}
          onClick={() => onPageChange(currentPage + 1)}
          type="button"
        >
          Next →
        </button>
      </div>
    </nav>
  );
}
