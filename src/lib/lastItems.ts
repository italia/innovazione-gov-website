import type { CardEditorialNewsProps } from "@components/molecules/CardEditorialNews/types";
import { ImageFragment } from "@graphql/fragment/commonFragments";
import { graphql } from "@graphql/graphql";
import type { SiteLocale } from "@graphql/types";
import { executeQuery } from "@lib/datocms";
import { linkResolver } from "@utils/linkResolver";
import { topicLinks } from "@utils/topicRoutes";

type Options = {
  locale: SiteLocale;
  includeDrafts: boolean;
  limit?: number;
  categoryIds?: string[];
  onlyArchived?: boolean;
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
    query LastArticles(
      $locale: SiteLocale
      $filter: ArticleModelFilter
      $first: IntType = 20
    ) {
      records: allArticles(
        orderBy: [dateShown_DESC, _firstPublishedAt_DESC]
        first: $first
        locale: $locale
        filter: $filter
      ) {
        id
        title
        description
        paragraph
        dateShown
        duration
        parentPage {
          ... on PageRecord {
            id
          }
          ... on InsightRecord {
            id
          }
        }
        firstPublishedAt: _firstPublishedAt
        tags {
          name
          slug
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

const MESI = [
  "gennaio",
  "febbraio",
  "marzo",
  "aprile",
  "maggio",
  "giugno",
  "luglio",
  "agosto",
  "settembre",
  "ottobre",
  "novembre",
  "dicembre",
];

function fineAttivita(durata?: string | null): number {
  if (!durata) return 0;
  const coda = durata.split(/[-–—]/).pop()?.trim().toLowerCase() ?? "";
  const anno = Number(coda.match(/\d{4}/)?.[0] ?? 0);
  if (!anno) return 0;
  const mese = MESI.findIndex((nome) => coda.includes(nome));
  return anno * 12 + (mese === -1 ? 12 : mese + 1);
}

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
  { locale, includeDrafts, limit = 3, categoryIds, onlyArchived }: Options,
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
        categoryLinks: topicLinks(r.tags, locale),
        filterCategories: filterCategoriesOf(r.tags),
        linkTo: linkResolver(r.id, locale),
      }),
    );

    return dedupeSortTop(articleItems, limit);
  }

  const articleType = ARTICLE_TYPE_BY_SELECTION[selection];
  const isProject = articleType === "project";
  const soloFocusDiNovita = articleType === "focus" && !categoryIds?.length;
  const filter = {
    ...(articleType ? { articleType: { eq: articleType } } : {}),
    ...(categoryIds?.length ? { tags: { anyIn: categoryIds } } : {}),
    ...(isProject ? { archived: { eq: Boolean(onlyArchived) } } : {}),
    ...(soloFocusDiNovita ? { parentPage: { exists: false } } : {}),
  };

  const { records } = await executeQuery(LastArticlesQuery, {
    variables: {
      locale,
      filter,
      first: Math.min(Math.max(limit, isProject ? 100 : 20), 100),
    },
    includeDrafts,
  });

  return records
    .map((r) => {
      const paginaDiSezione = articleType === "focus" && !!r.parentPage;
      const senzaMetadati = isProject || paginaDiSezione;

      return {
        id: r.id,
        isExternal: false,
        title: r.title ?? "",
        description: r.paragraph || r.description || "",
        image: (isProject ? (r.logo ?? r.image) : r.image) ?? undefined,
        imageFit: isProject && r.logo ? ("contain" as const) : undefined,
        dateTime: senzaMetadati
          ? undefined
          : (r.dateShown ?? r.firstPublishedAt ?? undefined),
        category: senzaMetadati
          ? []
          : (r.tags ?? []).map((t) => t.name).filter((v): v is string => !!v),
        categoryLinks: senzaMetadati ? {} : topicLinks(r.tags, locale),
        filterCategories: isProject
          ? (r.tags ?? []).map((t) => t.name).filter((v): v is string => !!v)
          : filterCategoriesOf(r.tags),
        duration: isProject ? r.duration : undefined,
        linkTo: linkResolver(r.id, locale),
      };
    })
    .sort((a, b) => {
      if (!isProject) return 0;
      if (!onlyArchived) return a.title.localeCompare(b.title);
      return fineAttivita(b.duration) - fineAttivita(a.duration);
    })
    .slice(0, limit);
}
