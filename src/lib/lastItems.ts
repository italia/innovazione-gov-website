import type { CardEditorialNewsProps } from "@components/molecules/CardEditorialNews/types";
import { ImageFragment } from "@graphql/fragment/commonFragments";
import { graphql } from "@graphql/graphql";
import type { SiteLocale } from "@graphql/types";
import { executeQuery } from "@lib/datocms";
import { linkResolver } from "@utils/linkResolver";

type Options = { locale: SiteLocale; includeDrafts: boolean };

const LastFocusPagesQuery = graphql(
  `
    query LastFocusPages($locale: SiteLocale) {
      records: allFocusPages(
        orderBy: dateShown_DESC
        first: 3
        locale: $locale
      ) {
        id
        title
        subtitle
        summary
        dateShown
        imageCover {
          ...ImageFragment
        }
      }
    }
  `,
  [ImageFragment],
);

const LastNewsQuery = graphql(`
  query LastNews($locale: SiteLocale) {
    records: allNews(orderBy: dateShown_DESC, first: 3, locale: $locale) {
      id
      title
      subtitle
      summary
      dateShown
    }
  }
`);

const LastPressReleasesQuery = graphql(`
  query LastPressReleases($locale: SiteLocale) {
    records: allPressReleases(
      orderBy: dateShown_DESC
      first: 3
      locale: $locale
    ) {
      id
      slug
      title
      subtitle
      summary
      dateShown
      tags {
        name
      }
    }
  }
`);

const LastArticlesQuery = graphql(
  `
    query LastArticles($locale: SiteLocale) {
      records: allArticles(
        orderBy: _firstPublishedAt_DESC
        first: 3
        locale: $locale
      ) {
        id
        title
        description
        paragraph
        firstPublishedAt: _firstPublishedAt
        image {
          ...ImageFragment
        }
      }
    }
  `,
  [ImageFragment],
);

export async function getLastItems(
  model: string,
  { locale, includeDrafts }: Options,
): Promise<CardEditorialNewsProps[]> {
  const variables = { locale };

  switch (model) {
    case "focus_page": {
      const { records } = await executeQuery(LastFocusPagesQuery, {
        variables,
        includeDrafts,
      });
      return records.map((r) => ({
        id: r.id,
        isExternal: false,
        title: r.title ?? "",
        description: r.summary || r.subtitle || "",
        image: r.imageCover ?? undefined,
        dateTime: r.dateShown ?? undefined,
        linkTo: linkResolver(r.id, locale),
      }));
    }
    case "news": {
      const { records } = await executeQuery(LastNewsQuery, {
        variables,
        includeDrafts,
      });
      return records.map((r) => ({
        id: r.id,
        isExternal: false,
        title: r.title ?? "",
        description: r.summary || r.subtitle || "",
        dateTime: r.dateShown ?? undefined,
        linkTo: linkResolver(r.id, locale),
      }));
    }
    case "press_release": {
      const { records } = await executeQuery(LastPressReleasesQuery, {
        variables,
        includeDrafts,
      });
      return records.map((r) => ({
        id: r.id,
        isExternal: false,
        title: r.title ?? "",
        description: r.summary || r.subtitle || "",
        category: r.tags
          .map((t) => t.name)
          .filter((name): name is string => !!name),
        dateTime: r.dateShown ?? undefined,
        linkTo: r.slug ? `/${locale}/notizie/comunicati-stampa/${r.slug}` : "#",
      }));
    }
    case "articles": {
      const { records } = await executeQuery(LastArticlesQuery, {
        variables,
        includeDrafts,
      });
      return records.map((r) => ({
        id: r.id,
        isExternal: false,
        title: r.title ?? "",
        description: r.paragraph || r.description || "",
        image: r.image ?? undefined,
        dateTime: r.firstPublishedAt ?? undefined,
        linkTo: linkResolver(r.id, locale),
      }));
    }
    default:
      return [];
  }
}
