import type { CardEditorialNewsProps } from "@components/react/CardEditorialNews";
import type { CardMeasureProps } from "@components/react/CardMeasure/types";
import type { ResourceProps } from "@components/react/Resource";
import type {
  NewsItemFragmentType,
  ResourceFragmentType,
  WebinarItemFragmentType,
} from "@graphql/fragment/commonFragments";
import type { MeasureFragmentType } from "@graphql/fragment/measure";
import type { ArticleCard } from "@graphql/query/articleCards";
import type { SiteLocale } from "@graphql/types";
import { getLocaleValue } from "@utils/getLocaleValue";
import { linkResolver } from "@utils/linkResolver";

export const mapNewsToCardEditorialNewsProps = (
  news: NewsItemFragmentType,
  lang: SiteLocale,
): CardEditorialNewsProps => {
  const link = getLocaleValue(news.allLinkLocales, lang, "");
  const topic = getLocaleValue(news.allTopicLocales, lang, null);
  return {
    id: news.id,
    title: getLocaleValue(news.allTitleLocales, lang, ""),
    description: getLocaleValue(news.allParagraphLocales, lang, ""),
    image: news.image,
    linkTo: link || "#",
    category: getLocaleValue(topic?._allLabelLocales, lang, ""),
    dateTime: news.publishedAt,
    action: link ? new URL(link).host : "",
    lang: lang,
    isExternal: true,
  };
};

export const mapArticleToCardEditorialNewsProps = (
  article: ArticleCard,
  lang: SiteLocale,
): CardEditorialNewsProps => {
  const tags = (article.tags ?? [])
    .map((t) => t.name)
    .filter((name): name is string => !!name);
  return {
    id: article.id,
    title: getLocaleValue(article.allTitleLocales, lang, "") ?? "",
    description:
      (getLocaleValue(article.allParagraphLocales, lang, "") ||
        getLocaleValue(article.allDescriptionLocales, lang, "")) ??
      "",
    image: article.image ?? undefined,
    dateTime: article.firstPublishedAt ?? undefined,
    category: tags,
    linkTo: linkResolver(article.id, lang),
    lang: lang,
    isExternal: false,
  };
};

export const mapWebinarToCardEditorialNewsProps = (
  webinar: WebinarItemFragmentType,
  lang: SiteLocale,
): CardEditorialNewsProps => {
  const topic = getLocaleValue(webinar.allTopicLocales, lang, null);
  return {
    id: webinar.id,
    title: getLocaleValue(webinar.allTitleLocales, lang, ""),
    description: getLocaleValue(webinar.allParagraphLocales, lang, ""),
    image: webinar.image,
    linkTo: linkResolver(webinar.id, lang),
    category: getLocaleValue(topic?._allLabelLocales, lang, ""),
    dateTime: webinar.publishedAt,
    lang: lang,
    isExternal: false,
  };
};
export const mapResourceToResourceProps = (
  resource: ResourceFragmentType,
  lang: SiteLocale,
): ResourceProps => {
  let url = "";
  let isDownload = false;

  const resourceContent = getLocaleValue(
    resource.allResourceLocales,
    lang,
    undefined,
  );
  if (!resourceContent) {
    return {} as ResourceProps;
  }

  if ("url" in resourceContent) {
    url = resourceContent.url;
    isDownload = false;
  } else {
    url = resourceContent.doc
      ? `${resourceContent.doc.url}?dl=${resourceContent.doc.filename}.${resourceContent.doc.format}`
      : "#";
    isDownload = true;
  }

  const categories = getLocaleValue(resource.allCategoryLocales, lang, []);
  const type = getLocaleValue(resource.allTypeResourceLocales, lang, null);
  return {
    title: resourceContent.label,
    category:
      categories.map((v: any) =>
        getLocaleValue(v._allLabelLocales, lang, ""),
      ) || [],
    description: resourceContent.description || "",
    url: url,
    download: isDownload,
    type: getLocaleValue(type?._allLabelLocales, lang, ""),
    lang: lang,
  };
};

export const mapMeasureToCardMeasureProps = (
  measure: MeasureFragmentType,
  lang: SiteLocale,
): CardMeasureProps => {
  const categories = getLocaleValue(measure.allCategoryLocales, lang, []);
  const benefits = getLocaleValue(
    measure.allBeneficiRaggiuntiLocales,
    lang,
    [],
  );

  // I dati CMS possono contenere refusi (es. 3 obiettivi su 2): normalizziamo
  // gli obiettivi raggiunti nell'intervallo [0, totalGoal] così "3/2" → "2/2".
  const totalGoal = Math.max(measure.totalGoal ?? 0, 0);
  const goalAchieved = Math.min(
    Math.max(measure.goalAchieved ?? 0, 0),
    totalGoal,
  );

  return {
    title: getLocaleValue(measure.allTitleLocales, lang, "") ?? "",
    description: getLocaleValue(measure.allDescriptionLocales, lang, "") ?? "",
    category: categories.map((c) => c.label ?? ""),
    benefits: benefits.map((b) => b.benefitLabel ?? ""),
    goalAchieved,
    totalGoal,
    lang: lang,
  };
};

/**
 * Estrae le label delle categorie misura (uniche) ordinate secondo la
 * `position` impostata su DatoCMS col riordino drag & drop del modello
 * Measure category. Usata per l'ordine di pills/dropdown del filtro.
 */
export const getOrderedMeasureCategories = (
  measures: MeasureFragmentType[],
  lang: SiteLocale,
): string[] => {
  const byLabel = new Map<string, number>();
  for (const measure of measures) {
    for (const cat of getLocaleValue(measure.allCategoryLocales, lang, [])) {
      if (cat.label && !byLabel.has(cat.label)) {
        byLabel.set(cat.label, cat.position ?? Number.MAX_SAFE_INTEGER);
      }
    }
  }
  return [...byLabel.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([label]) => label);
};
