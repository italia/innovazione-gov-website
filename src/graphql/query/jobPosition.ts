import {
  AllJobPositionsRecordFragment,
  AllJobPositionsSlugFragment,
} from "@graphql/fragment/jobPosition";
import { TagFragment } from "@graphql/fragment/commonFragments";
import { SeoFieldFragment } from "@graphql/fragment/seoFragments";
import { graphql } from "@graphql/graphql";

export const AllJobPositionsContentQuery = graphql(
  `
    query AllJobPositionsContentQuery {
      allJobPositions(first: 500) {
        ...AllJobPositionsRecordFragment
      }
    }
  `,
  [AllJobPositionsRecordFragment],
);

export const JobPositionsLinksQuery = graphql(
  `
    query JobPositionsLinks {
      allJobPositions(first: 500) {
        ...AllJobPositionsSlugFragment
      }
    }
  `,
  [AllJobPositionsSlugFragment],
);

export const JobPositionsSeoQuery = graphql(
  `
    query JobPositionsSeo($locale: SiteLocale!) {
      allJobPositions(locale: $locale, first: 500) {
        id
        metaTags: _seoMetaTags {
          ...TagFragment
        }
        seo {
          ...SeoFieldFragment
        }
        updatedAt: _updatedAt
      }
    }
  `,
  [TagFragment, SeoFieldFragment],
);
