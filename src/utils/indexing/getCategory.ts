import type { CatalogueIndexingFragmentType } from "@graphql/fragment/indexing";
import type { SiteLocale } from "@graphql/types";
import { DatoBlockModel } from "@utils/cmsMapper";
import { getLocaleValue } from "@utils/getLocaleValue";

type tabType = { type: string; title: string };
type catalogueMapCategory = { type: tabType[]; title?: string };

export const getTabTitleByType = (
  catalogues: catalogueMapCategory[],
  searchType: string,
): string | undefined => {
  const catalogueMatch = catalogues.find((item) =>
    item.type.some((t) => t.type === searchType),
  );

  return catalogueMatch?.type.find((t) => t.type === searchType)?.title;
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
