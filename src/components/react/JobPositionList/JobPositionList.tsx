import type { SiteLocale } from "@graphql/types";
import { getI18n } from "@i18n/microcopy";
import { Pagination } from "@components/react/Pagination";
import { useMemo, useRef, useState } from "react";

export type JobPositionItemProps = {
  id: string;
  title: string;
  description?: string;
  linkTo: string;
  /** Uno dei sei stati del bando: open, closed, results, withdrawn, expired, suspended. */
  status: string;
  statusLabel: string;
};

type JobPositionListProps = {
  items: JobPositionItemProps[];
  perPage?: number;
  lang: SiteLocale;
};

export function JobPositionList({
  items,
  perPage = 10,
  lang,
}: JobPositionListProps) {
  const t = getI18n(lang);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const resultsRef = useRef<HTMLDivElement>(null);

  const visibleItems = useMemo(() => {
    const cercato = query.trim().toLowerCase();
    if (!cercato) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(cercato) ||
        (item.description ?? "").toLowerCase().includes(cercato),
    );
  }, [items, query]);

  const totalPages = Math.ceil(visibleItems.length / perPage);
  const currentPage = Math.min(page, Math.max(totalPages, 1));
  const start = (currentPage - 1) * perPage;
  const paginated = visibleItems.slice(start, start + perPage);

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    const results = resultsRef.current;
    if (!results) return;
    results.focus({ preventScroll: true });
    results.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  };

  return (
    <div className="container position-list">
      <div className="position-list__column">
        <div className="row position-list__filters">
          <div className="col-12">
            <div className="form-group mb-0">
              <label
                className={query ? "active" : undefined}
                htmlFor="position-search"
              >
                {t["position.search"]}
              </label>
              <input
                id="position-search"
                type="search"
                className="form-control"
                autoComplete="off"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>

        <div ref={resultsRef} tabIndex={-1} className="collection-results">
          {paginated.length === 0 ? (
            <p className="position-list__empty">{t["position.noResults"]}</p>
          ) : (
            <ul className="list-unstyled position-list__items">
              {paginated.map((item) => (
                <li className="position-item" key={item.id}>
                  <p className="position-item__head">
                    <a className="position-item__link" href={item.linkTo}>
                      {item.title}
                      <svg
                        className="icon icon-sm icon-primary"
                        aria-hidden="true"
                      >
                        <use href="/bsi-svg/sprites.svg#it-arrow-right" />
                      </svg>
                    </a>
                    <span className="position-item__badge">
                      {item.statusLabel}
                    </span>
                  </p>
                  {item.description && (
                    <p className="position-item__text">{item.description}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Pagination
          lang={lang}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
