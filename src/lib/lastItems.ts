import type { CardEditorialNewsProps } from "@components/molecules/CardEditorialNews/types";
import { ImageFragment } from "@graphql/fragment/commonFragments";
import { graphql } from "@graphql/graphql";
import type { SiteLocale } from "@graphql/types";
import { executeQuery } from "@lib/datocms";
import { linkResolver } from "@utils/linkResolver";

type Options = { locale: SiteLocale; includeDrafts: boolean };

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
