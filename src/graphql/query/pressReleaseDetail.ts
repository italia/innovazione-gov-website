import { ImageFragment, TagFragment } from "@graphql/fragment/commonFragments";
import { graphql } from "@graphql/graphql";

export const PressReleasesByLocaleQuery = graphql(
  `
    query PressReleasesByLocale($locale: SiteLocale) {
      allPressReleases(first: 500, locale: $locale) {
        id
        slug
        title
        subtitle
        summary
        paragraph
        dateShown
        image {
          ...ImageFragment
        }
        seoMeta: _seoMetaTags(locale: $locale) {
          ...TagFragment
        }
        tags {
          name
        }
      }
    }
  `,
  [ImageFragment, TagFragment],
);
