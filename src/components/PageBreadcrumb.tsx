import Link from "next/link";

type BreadcrumbItem = {
  href?: string;
  label: string;
  onClick?: () => void;
};

type Props = {
  items: BreadcrumbItem[];
};

export function PageBreadcrumb({ items }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="page-breadcrumb">
      <ol className="page-breadcrumb__list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li className="page-breadcrumb__item" key={`${item.label}-${index}`}>
              {isLast ? (
                <span className="page-breadcrumb__current" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  className="page-breadcrumb__link"
                  href={item.href ?? "#"}
                >
                  {item.label}
                </Link>
              )}
              {!isLast ? (
                <span aria-hidden="true" className="page-breadcrumb__sep">
                  /
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
