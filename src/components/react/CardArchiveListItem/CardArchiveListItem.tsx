import { DateTime } from "@components/react/DateTime";
import type { SiteLocale } from "@graphql/types";

export type CardArchiveListItemProps = {
  id?: string;
  title: string;
  description?: string;
  dateTime?: string;
  linkTo: string;
  lang: SiteLocale;
};

export function CardArchiveListItem({
  title,
  description,
  dateTime,
  linkTo,
  lang,
}: CardArchiveListItemProps) {
  return (
    <li>
      <a
        className="list-item align-items-start border-bottom-0 pt-3 px-0 px-sm-2 px-md-4 left-icon"
        href={linkTo}
      >
        <svg
          className="icon icon-sm icon-primary mt-1 flex-shrink-0 me-1 me-md-3"
          aria-hidden="true"
        >
          <use
            href="/bsi-svg/sprites.svg#it-file"
            xlinkHref="/bsi-svg/sprites.svg#it-file"
          />
        </svg>
        <span>
          <h3 className="h6 mb-0">
            <strong>{title}</strong>
          </h3>
          <p className="text-secondary fw-normal d-block mb-3 mt-1 small">
            {dateTime && <DateTime value={dateTime} className="" lang={lang} />}
            {description && <span> — {description}</span>}
          </p>
        </span>
      </a>
    </li>
  );
}
