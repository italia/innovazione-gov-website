import type { CardEditorialNewsProps } from "@components/molecules/CardEditorialNews/types";
import { ImageFragment } from "@graphql/fragment/commonFragments";
import { graphql } from "@graphql/graphql";
import type { SiteLocale } from "@graphql/types";
import { executeQuery } from "@lib/datocms";
import { linkResolver } from "@utils/linkResolver";

type Options = {
  locale: SiteLocale;
  includeDrafts: boolean;
  limit?: number;
  categoryIds?: string[];
};

const ARTICLE_TYPE_BY_SELECTION: Record<string, string> = {
  news: "news",
  interview: "interview",
  participation: "participation",
  press_release: "press_release",
  focus: "focus",
  guida: "guida",
  focus_page: "focus",
  project: "project",
};

const LastArticlesQuery = graphql(
  `
    query LastArticles($locale: SiteLocale, $filter: ArticleModelFilter) {
      records: allArticles(
        orderBy: [dateShown_DESC, _firstPublishedAt_DESC]
        first: 20
        locale: $locale
        filter: $filter
      ) {
        id
        title
        description
        paragraph
        dateShown
        firstPublishedAt: _firstPublishedAt
        tags {
          name
          isCategory
        }
        image {
          ...ImageFragment
        }
        logo {
          ...ImageFragment
        }
      }
    }
  `,
  [ImageFragment],
);

function dedupeSortTop(
  items: CardEditorialNewsProps[],
  n: number,
): CardEditorialNewsProps[] {
  const byTitle = new Map<string, CardEditorialNewsProps>();
  for (const item of items) {
    const key = item.title.trim().toLowerCase();
    const existing = byTitle.get(key);
    if (!existing || (!existing.image && item.image)) byTitle.set(key, item);
  }
  return [...byTitle.values()]
    .sort((a, b) => (b.dateTime ?? "").localeCompare(a.dateTime ?? ""))
    .slice(0, n);
}

const filterCategoriesOf = (
  tags: { name: string | null; isCategory: boolean | null }[] | null,
): string[] =>
  (tags ?? [])
    .filter((tag) => tag.isCategory)
    .map((tag) => tag.name)
    .filter((name): name is string => !!name);

export async function getLastItems(
  selection: string,
  { locale, includeDrafts, limit = 3, categoryIds }: Options,
): Promise<CardEditorialNewsProps[]> {
  if (selection === "articles") {
    const articlesRes = await executeQuery(LastArticlesQuery, {
      variables: { locale, filter: { articleType: { eq: "news" } } },
      includeDrafts,
    });

    const articleItems: CardEditorialNewsProps[] = articlesRes.records.map(
      (r) => ({
        id: r.id,
        isExternal: false,
        title: r.title ?? "",
        description: r.paragraph || r.description || "",
        image: r.image ?? undefined,
        dateTime: r.dateShown ?? r.firstPublishedAt ?? undefined,
        category: (r.tags ?? [])
          .map((t) => t.name)
          .filter((v): v is string => !!v),
        filterCategories: filterCategoriesOf(r.tags),
        linkTo: linkResolver(r.id, locale),
      }),
    );

    return dedupeSortTop(articleItems, limit);
  }

  const articleType = ARTICLE_TYPE_BY_SELECTION[selection];
  const filter = {
    ...(articleType ? { articleType: { eq: articleType } } : {}),
    ...(categoryIds?.length ? { tags: { anyIn: categoryIds } } : {}),
  };

  const isProject = articleType === "project";

  const { records } = await executeQuery(LastArticlesQuery, {
    variables: { locale, filter },
    includeDrafts,
  });

  return records
    .map((r) => ({
      id: r.id,
      isExternal: false,
      title: r.title ?? "",
      description: r.paragraph || r.description || "",
      image: (isProject ? (r.logo ?? r.image) : r.image) ?? undefined,
      imageFit: isProject && r.logo ? ("contain" as const) : undefined,
      dateTime: isProject
        ? undefined
        : (r.dateShown ?? r.firstPublishedAt ?? undefined),
      category: isProject
        ? []
        : (r.tags ?? []).map((t) => t.name).filter((v): v is string => !!v),
      filterCategories: filterCategoriesOf(r.tags),
      linkTo: linkResolver(r.id, locale),
    }))
    .sort((a, b) => (isProject ? a.title.localeCompare(b.title) : 0))
    .slice(0, limit);
}
