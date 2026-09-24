import type { SiteLocale } from "@graphql/types";
import { getI18n } from "@i18n/microcopy";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  lang: SiteLocale;
};

const Freccia = ({ verso }: { verso: "prev" | "next" }) => (
  <svg
    className={`page-link__freccia page-link__freccia--${verso}`}
    width="9"
    height="15"
    viewBox="0 0 9 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M7.46667 14.9333L0 7.46667L7.46667 0L8.53333 0.933334L2 7.46667L8.53333 14L7.46667 14.9333Z"
      fill="#768594"
    />
  </svg>
);

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  lang,
}: PaginationProps) {
  if (totalPages <= 1) return null;
  const t = getI18n(lang);

  return (
    <nav aria-label={t["nav.pagination"]}>
      <ul className="pagination justify-content-center pt-5">
        <li className="page-item">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label={t["nav.prev"]}
            className="page-link page-link--arrow"
          >
            <Freccia verso="prev" />
          </button>
        </li>
        {Array.from({ length: totalPages }, (_, idx) => (
          <li key={idx} className="page-item">
            <button
              onClick={() => onPageChange(idx + 1)}
              aria-current={currentPage === idx + 1 ? "page" : undefined}
              className={`page-link ${currentPage === idx + 1 ? "active" : ""}`}
            >
              {idx + 1}
            </button>
          </li>
        ))}
        <li className="page-item">
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label={t["nav.next"]}
            className="page-link page-link--arrow"
          >
            <Freccia verso="next" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
