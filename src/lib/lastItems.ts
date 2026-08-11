import type { CardEditorialNewsProps } from "@components/molecules/CardEditorialNews/types";
import { ImageFragment } from "@graphql/fragment/commonFragments";
import { graphql } from "@graphql/graphql";
import type { SiteLocale } from "@graphql/types";
import { executeQuery } from "@lib/datocms";
import { linkResolver } from "@utils/linkResolver";

type Options = { locale: SiteLocale; includeDrafts: boolean };

const ARTICLE_TYPE_BY_SELECTION: Record<string, string> = {
  news: "news",
  press_release: "press_release",
  focus: "focus",
  guida: "guida",
  focus_page: "focus",
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
        }
        image {
          ...ImageFragment
        }
      }
    }
  `,
  [ImageFragment],
);

const LastStoriesQuery = graphql(
  `
    query LastStories($locale: SiteLocale) {
      records: allStoryItems(
        orderBy: _firstPublishedAt_DESC
        first: 20
        locale: $locale
      ) {
        id
        title
        paragraph
        firstPublishedAt: _firstPublishedAt
        topics {
          label
        }
        image {
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

export async function getLastItems(
  selection: string,
  { locale, includeDrafts }: Options,
): Promise<CardEditorialNewsProps[]> {
  if (selection === "articles") {
    const [articlesRes, storiesRes] = await Promise.all([
      executeQuery(LastArticlesQuery, {
        variables: { locale, filter: { articleType: { eq: "news" } } },
        includeDrafts,
      }),
      executeQuery(LastStoriesQuery, { variables: { locale }, includeDrafts }),
    ]);

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
        linkTo: linkResolver(r.id, locale),
      }),
    );

    const storyItems: CardEditorialNewsProps[] = storiesRes.records.map(
      (r) => ({
        id: r.id,
        isExternal: false,
        title: r.title ?? "",
        description: r.paragraph ?? "",
        image: r.image ?? undefined,
        dateTime: r.firstPublishedAt ?? undefined,
        category: (r.topics ?? [])
          .map((t) => t.label)
          .filter((v): v is string => !!v),
        linkTo: linkResolver(r.id, locale),
      }),
    );

    return dedupeSortTop([...articleItems, ...storyItems], 3);
  }

  const articleType = ARTICLE_TYPE_BY_SELECTION[selection];
  const filter = articleType ? { articleType: { eq: articleType } } : {};

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
      image: r.image ?? undefined,
      dateTime: r.dateShown ?? r.firstPublishedAt ?? undefined,
      category: (r.tags ?? [])
        .map((t) => t.name)
        .filter((v): v is string => !!v),
      linkTo: linkResolver(r.id, locale),
    }))
    .slice(0, 3);
}
