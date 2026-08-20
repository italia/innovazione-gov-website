import type { CardEditorialNewsProps } from "@components/molecules/CardEditorialNews/types";
import type { ArticleCard } from "@graphql/query/articleCards";
import type { SiteLocale } from "@graphql/types";
import { getLocaleValue } from "@utils/getLocaleValue";
import { linkResolver } from "@utils/linkResolver";

type RelatedOptions = {
  currentId: string;
  tags: string[];
  articleType: string | null;
  locale: SiteLocale;
};

function toCard(
  article: ArticleCard,
  locale: SiteLocale,
): CardEditorialNewsProps {
  return {
    id: article.id,
    title: getLocaleValue(article.allTitleLocales, locale, ""),
    description:
      getLocaleValue(article.allParagraphLocales, locale, "") ||
      getLocaleValue(article.allDescriptionLocales, locale, "") ||
      "",
    image: article.image ?? undefined,
    dateTime: article.firstPublishedAt ?? undefined,
    category: (article.tags ?? [])
      .map((tag) => tag.name)
      .filter((name): name is string => !!name),
    linkTo: linkResolver(article.id, locale),
    isExternal: false,
  };
}

export function getRelatedArticles(
  all: ArticleCard[],
  { currentId, tags, articleType, locale }: RelatedOptions,
): CardEditorialNewsProps[] {
  const byDateDesc = (a: ArticleCard, b: ArticleCard) =>
    (b.firstPublishedAt ?? "").localeCompare(a.firstPublishedAt ?? "");

  const others = all.filter(
    (article) =>
      article.id !== currentId &&
      !!getLocaleValue(article.allTitleLocales, locale, ""),
  );

  const tagSet = new Set(tags);
  const picked = others
    .filter((article) =>
      (article.tags ?? []).some((tag) => tag.name && tagSet.has(tag.name)),
    )
    .sort(byDateDesc);

  const pushMissing = (candidates: ArticleCard[]) => {
    const seen = new Set(picked.map((article) => article.id));
    for (const article of candidates) {
      if (!seen.has(article.id)) picked.push(article);
    }
  };

  if (picked.length < 3 && articleType) {
    pushMissing(
      others
        .filter((article) => article.articleType === articleType)
        .sort(byDateDesc),
    );
  }
  if (picked.length < 3) {
    pushMissing([...others].sort(byDateDesc));
  }

  return picked.slice(0, 3).map((article) => toCard(article, locale));
}
