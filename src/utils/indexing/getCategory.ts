import type { CatalogueIndexingFragmentType } from "@graphql/fragment/indexing";
import type { SiteLocale } from "@graphql/types";
import { DatoBlockModel } from "@utils/cmsMapper";
import { getLocaleValue } from "@utils/getLocaleValue";
import { getBreadcrumbs } from "@utils/linkResolver";

type tabType = { type: string; title: string };
type catalogueMapCategory = { type: tabType[]; title?: string };

/**
 * Category of a routed record (article, insight, webinar, page), taken from
 * its own breadcrumb in the link map: the sections between the homepage and
 * the record itself, e.g. "Attività, Infrastrutture e Connettività".
 * The search UI splits on "," and renders one badge per section.
 */
export const getCategoryFromBreadcrumb = (
  id: string,
  lang: SiteLocale,
): string => {
  return getBreadcrumbs(id, lang)
    .slice(1, -1)
    .map((step) => step.title.trim())
    .filter(Boolean)
    .join(", ");
};
export const getTitleByTypeNews = (
  catalogues: catalogueMapCategory[],
  searchType: string,
): string | undefined => {
  const catalogueMatch = catalogues.find((item) =>
    item.type.some((t) => t.type === searchType),
  );
  if (!catalogueMatch) return undefined;

  const specificType = catalogueMatch.type.find((t) => t.type === searchType);
  return `${catalogueMatch?.title}, ${specificType?.title}`;
};

export const getTitleByTypeResourse = (
  catalogues: catalogueMapCategory[],
  searchType: string,
): string | undefined => {
  const catalogueMatch = catalogues.find((item) =>
    item.type.some((t) => t.type === searchType),
  );

  return catalogueMatch?.title;
};

export const getCataloguesMapCategory = (
  allCatalogues: CatalogueIndexingFragmentType[],
  lang: SiteLocale,
): catalogueMapCategory[] => {
  return allCatalogues.map((catalogue) => {
    const title = getLocaleValue(catalogue.allTitleLocales, lang, "");
    const feedRecord = catalogue.content.find(
      (item) => item.componentName === DatoBlockModel.CatalogueFeed,
    );
    let tabTypes: tabType[] = [];
    if (feedRecord && "tabs" in feedRecord) {
      tabTypes =
        feedRecord.tabs?.map((item) => {
          return { type: item.newsPageTabType, title: item.title };
        }) || [];
    }

    return {
      type: tabTypes,
      title,
    };
  });
};
