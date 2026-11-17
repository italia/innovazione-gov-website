import { DateTime } from "@components/react/DateTime";
import type { SiteLocale } from "@graphql/types";
import { getI18n } from "@i18n/microcopy";
import type { AnnouncementStatusProps } from "@utils/announcementCategory";

export type CardArchiveListItemProps = {
  id?: string;
  title: string;
  description?: string;
  dateTime?: string;
  deadline?: string;
  status?: AnnouncementStatusProps;
  badge?: string;
  linkTo: string;
  lang: SiteLocale;
};

export function CardArchiveListItem({
  title,
  description,
  dateTime,
  deadline,
  status,
  badge,
  linkTo,
  lang,
}: CardArchiveListItemProps) {
  const t = getI18n(lang);
  const hasMeta = !!status || !!deadline || !!badge;

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
          {hasMeta && (
            <span className="archive-item__badges">
              {badge && <span className="archive-item__badge">{badge}</span>}
              {status?.label && (
                <span className="archive-item__status">
                  <span className="visually-hidden">
                    {t["announcement.status.label"]}:{" "}
                  </span>
                  {status.label}
                </span>
              )}
              {deadline && (
                <span className="archive-item__deadline">
                  {t["announcement.deadline"]}{" "}
                  <DateTime value={deadline} className="" lang={lang} />
                </span>
              )}
            </span>
          )}
          <h3 className="mb-0 archive-item__title">{title}</h3>
          <p className="fw-normal d-block mb-3 mt-1 archive-item__meta">
            {dateTime && <DateTime value={dateTime} className="" lang={lang} />}
            {description && (
              <span>
                {dateTime ? " — " : ""}
                {description}
              </span>
            )}
          </p>
        </span>
      </a>
    </li>
  );
}
