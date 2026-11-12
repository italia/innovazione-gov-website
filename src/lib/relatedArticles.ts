import type { CardEditorialNewsProps } from "@components/molecules/CardEditorialNews/types";
import type { ArticleCard } from "@graphql/query/articleCards";
import type { SiteLocale } from "@graphql/types";
import { getLocaleValue } from "@utils/getLocaleValue";
import { linkResolver } from "@utils/linkResolver";
import {
  articleTypeLabel,
  isActivityType,
  isEditorialType,
  showsImageInCard,
} from "@utils/storyClassification";
import { topicLinks } from "@utils/topicRoutes";

type RelatedOptions = {
  currentId: string;
  tags: string[];
  articleType: string | null;
  locale: SiteLocale;
};

export function schedaCorrelata(
  article: ArticleCard,
  locale: SiteLocale,
): CardEditorialNewsProps {
  const attivita = isActivityType(article.articleType);
  return {
    id: article.id,
    title: getLocaleValue(article.allTitleLocales, locale, ""),
    description:
      getLocaleValue(article.allParagraphLocales, locale, "") ||
      getLocaleValue(article.allDescriptionLocales, locale, "") ||
      "",
    image: showsImageInCard(article.articleType)
      ? (article.image ?? undefined)
      : undefined,
    badge: articleTypeLabel(article.articleType),
    dateTime: attivita
      ? undefined
      : (article.dateShown ?? article.firstPublishedAt ?? undefined),
    category: attivita
      ? []
      : (article.tags ?? [])
          .map((tag) => tag.name)
          .filter((name): name is string => !!name),
    categoryLinks: attivita ? {} : topicLinks(article.tags, locale),
    linkTo: linkResolver(article.id, locale),
    isExternal: false,
  };
}

export function getRelatedArticles(
  all: ArticleCard[],
  { currentId, tags, articleType, locale }: RelatedOptions,
): CardEditorialNewsProps[] {
  const dataDiRiferimento = (article: ArticleCard) =>
    article.dateShown ?? article.firstPublishedAt ?? "";

  const byDateDesc = (a: ArticleCard, b: ArticleCard) =>
    dataDiRiferimento(b).localeCompare(dataDiRiferimento(a));

  const tagSet = new Set(tags);
  const tagInComune = (article: ArticleCard) =>
    (article.tags ?? []).filter((tag) => tag.name && tagSet.has(tag.name))
      .length;

  const perAttivita = isActivityType(articleType);

  const candidati = all.filter(
    (article) =>
      article.id !== currentId &&
      !!getLocaleValue(article.allTitleLocales, locale, "") &&
      (perAttivita
        ? isEditorialType(article.articleType) && tagInComune(article) > 0
        : article.articleType === articleType),
  );

  return candidati
    .sort((a, b) => tagInComune(b) - tagInComune(a) || byDateDesc(a, b))
    .slice(0, 3)
    .map((article) => schedaCorrelata(article, locale));
}
