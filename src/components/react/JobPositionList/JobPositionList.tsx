import { Pagination } from "@components/react/Pagination";
import type { SiteLocale } from "@graphql/types";
import { getI18n } from "@i18n/microcopy";
import { useState } from "react";

export type JobPositionItemProps = {
  id: string;
  title: string;
  description?: string;
  linkTo: string;
  /** "open" | "closed": arriva dal campo Stato su DatoCMS. */
  status: string;
};

type JobPositionListProps = {
  items: JobPositionItemProps[];
  perPage?: number;
  lang: SiteLocale;
};

export function JobPositionList({
  items,
  perPage = 5,
  lang,
}: JobPositionListProps) {
  const [page, setPage] = useState(1);
  const t = getI18n(lang);

  const totalPages = Math.ceil(items.length / perPage);
  const start = (page - 1) * perPage;
  const paginated = items.slice(start, start + perPage);

  return (
    <div className="container">
      <ul className="list-unstyled">
        {paginated.map((item) => (
          <li className="mb-4" key={item.id}>
            <div className="d-md-flex align-items-center gap-2">
              <a
                className="d-inline-flex align-items-center gap-2"
                href={item.linkTo}
              >
                <span className="fw-semibold">{item.title}</span>
                <svg className="icon icon-sm icon-primary" aria-hidden="true">
                  <use href="/bsi-svg/sprites.svg#it-arrow-right" />
                </svg>
              </a>
              <span className="badge bg-secondary ms-md-2">
                {item.status === "closed"
                  ? t["position.closed"]
                  : t["position.open"]}
              </span>
            </div>
            {item.description && (
              <p className="fs-6 mb-0 mt-1">{item.description}</p>
            )}
          </li>
        ))}
      </ul>

      <Pagination
        lang={lang}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
