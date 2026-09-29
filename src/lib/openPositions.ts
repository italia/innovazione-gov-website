import type { OpenPositionItemProps } from "@components/organisms/ListOpenPositions";
import type { SiteLocale } from "@graphql/types";
import { getLocaleValue } from "@utils/getLocaleValue";
import { linkResolver } from "@utils/linkResolver";
import { effectivePositionStatus } from "@utils/positionStatus";
import { getCollection } from "astro:content";

const quando = (position: {
  sortDate: string | null;
  openDate: string | null;
}) => position.sortDate ?? position.openDate ?? "";

export async function getOpenPositions(
  locale: SiteLocale,
  limit = 3,
): Promise<OpenPositionItemProps[]> {
  const positions = await getCollection("job_position");

  return positions
    .map((entry) => entry.data)
    .filter((position) => position.locales.includes(locale))
    .filter(
      (position) =>
        effectivePositionStatus(position.positionStatus, position.closeDate) ===
        "open",
    )
    .sort((a, b) => quando(b).localeCompare(quando(a)))
    .map((position) => ({
      id: position.id,
      title: getLocaleValue(position.allTitleLocales, locale, ""),
      description:
        getLocaleValue(position.allAbstractLocales, locale, "") ?? "",
      image: position.image ?? undefined,
      linkTo: linkResolver(position.id, locale),
    }))
    .filter((item) => item.title && item.linkTo !== "#")
    .slice(0, limit);
}
