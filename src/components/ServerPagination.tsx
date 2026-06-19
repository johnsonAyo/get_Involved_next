import Link from "next/link";

type Props = {
  currentPage: number;
  pageCount: number;
  buildHref: (page: number) => string;
};

export function ServerPagination({
  currentPage,
  pageCount,
  buildHref,
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
    <nav aria-label="Polling unit pages" className="pagination">
      <p aria-live="polite" className="ds-meta pagination__status">
        Page {String(currentPage).padStart(2, "0")} of{" "}
        {String(pageCount).padStart(2, "0")}
      </p>
      <div className="pagination__controls">
        {currentPage === 1 ? (
          <button className="pagination__direction" disabled type="button">
            ← Previous
          </button>
        ) : (
          <Link className="pagination__direction" href={buildHref(currentPage - 1)}>
            ← Previous
          </Link>
        )}
        
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
            
            if (page === currentPage) {
              return (
                <button
                  aria-current="page"
                  aria-label={`Page ${page}`}
                  className="pagination__page"
                  key={page}
                  type="button"
                >
                  {String(page).padStart(2, "0")}
                </button>
              );
            }
            
            return (
              <Link
                aria-label={`Page ${page}`}
                className="pagination__page"
                key={page}
                href={buildHref(page)}
              >
                {String(page).padStart(2, "0")}
              </Link>
            );
          })}
        </div>
        
        {currentPage === pageCount ? (
          <button className="pagination__direction" disabled type="button">
            Next →
          </button>
        ) : (
          <Link className="pagination__direction" href={buildHref(currentPage + 1)}>
            Next →
          </Link>
        )}
      </div>
    </nav>
  );
}
