import { ImageFragment } from "@graphql/fragment/commonFragments";
import { graphql, type ResultOf } from "@graphql/graphql";

export const AllArticleCardsQuery = graphql(
  `
    query AllArticleCards {
      allArticles(
        first: 2500
        orderBy: [dateShown_DESC, _firstPublishedAt_DESC]
      ) {
        id
        articleType
        undersecretary
        allTitleLocales: _allTitleLocales {
          locale
          value
        }
        allParagraphLocales: _allParagraphLocales {
          locale
          value
        }
        allDescriptionLocales: _allDescriptionLocales {
          locale
          value
        }
        dateShown
        firstPublishedAt: _firstPublishedAt
        tags {
          name
          slug
          isCategory
        }
        image {
          ...ImageFragment
        }
      }
    }
  `,
  [ImageFragment],
);

export type ArticleCard = ResultOf<
  typeof AllArticleCardsQuery
>["allArticles"][number];
