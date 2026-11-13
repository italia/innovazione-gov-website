import type { OpenPositionItemProps } from "@components/organisms/ListOpenPositions";
import { AltamiraJobPositionsQuery } from "@graphql/query/jobPosition";
import type { SiteLocale } from "@graphql/types";
import { executeQuery } from "@lib/datocms";
import { altamiraJobUrl } from "@utils/altamira";
import { getLocaleValue } from "@utils/getLocaleValue";
import { linkResolver } from "@utils/linkResolver";
import { effectivePositionStatus } from "@utils/positionStatus";

const quando = (position: {
  sortDate: string | null;
  openDate: string | null;
}) => position.sortDate ?? position.openDate ?? "";

// Una sola richiesta per build, condivisa fra lingue e pagine.
let altamiraPositions: ReturnType<typeof fetchAltamiraPositions> | undefined;

async function fetchAltamiraPositions() {
  const response = await executeQuery(AltamiraJobPositionsQuery);
  return response?.allJobPositions ?? [];
}

/**
 * Le ultime posizioni aperte collegate a un annuncio Altamira, con il link
 * all'annuncio sul career site. Lista vuota se nessuna posizione ha il JobID.
 */
export async function getOpenPositions(
  locale: SiteLocale,
  limit = 3,
): Promise<OpenPositionItemProps[]> {
  altamiraPositions ??= fetchAltamiraPositions();
  const positions = await altamiraPositions;

  return positions
    .filter((position) => position.locales.includes(locale))
    .filter(
      (position) =>
        effectivePositionStatus(position.positionStatus, position.closeDate) ===
        "open",
    )
    .sort((a, b) => quando(b).localeCompare(quando(a)))
    .map((position) => {
      const altamiraUrl = altamiraJobUrl(
        position.altamiraJobId,
        getLocaleValue(position.allSlugLocales, locale, ""),
      );
      return {
        id: position.id,
        title: getLocaleValue(position.allTitleLocales, locale, ""),
        description:
          getLocaleValue(position.allAbstractLocales, locale, "") ?? "",
        image: position.image ?? undefined,
        linkTo: altamiraUrl ?? linkResolver(position.id, locale),
        external: Boolean(altamiraUrl),
      };
    })
    .filter((item) => item.title && item.linkTo !== "#")
    .slice(0, limit);
}
