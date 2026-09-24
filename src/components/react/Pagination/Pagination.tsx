import type { SiteLocale } from "@graphql/types";
import { getI18n } from "@i18n/microcopy";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  lang: SiteLocale;
};

const SALTO = "salto";

type VocePaginazione = number | typeof SALTO;

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

export function vociPaginazione(
  currentPage: number,
  totalPages: number,
  raggio = 1,
): VocePaginazione[] {
  const pagine = new Set<number>([1, totalPages]);
  for (
    let pagina = currentPage - raggio;
    pagina <= currentPage + raggio;
    pagina += 1
  ) {
    if (pagina > 1 && pagina < totalPages) pagine.add(pagina);
  }

  const voci: VocePaginazione[] = [];
  let precedente = 0;
  for (const pagina of [...pagine].sort((a, b) => a - b)) {
    if (pagina - precedente > 1) voci.push(SALTO);
    voci.push(pagina);
    precedente = pagina;
  }
  return voci;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  lang,
}: PaginationProps) {
  if (totalPages <= 1) return null;
  const t = getI18n(lang);
  const voci = vociPaginazione(currentPage, totalPages);

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
        {voci.map((voce, indice) =>
          voce === SALTO ? (
            <li className="page-item page-item--salto" key={`salto-${indice}`}>
              <span className="page-link page-link--salto" aria-hidden="true">
                …
              </span>
            </li>
          ) : (
            <li
              key={voce}
              className={`page-item ${
                Math.abs(voce - currentPage) === 1 ? "page-item--vicina" : ""
              }`}
            >
              <button
                onClick={() => onPageChange(voce)}
                aria-current={currentPage === voce ? "page" : undefined}
                aria-label={`${t["nav.pagination"]} ${voce}`}
                className={`page-link ${currentPage === voce ? "active" : ""}`}
              >
                {voce}
              </button>
            </li>
          ),
        )}
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
