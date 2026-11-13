import {
  AllJobPositionsRecordFragment,
  AllJobPositionsSlugFragment,
} from "@graphql/fragment/jobPosition";
import { ImageFragment, TagFragment } from "@graphql/fragment/commonFragments";
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

/**
 * Posizioni collegate a un annuncio Altamira (JobID valorizzato): alimentano
 * le card "Ultime posizioni aperte". Stato, lingua e ordinamento si applicano
 * in getOpenPositions, con le stesse regole dell'archivio.
 */
export const AltamiraJobPositionsQuery = graphql(
  `
    query AltamiraJobPositions {
      allJobPositions(
        first: 500
        filter: { altamiraJobId: { isPresent: true } }
      ) {
        id
        locales: _locales
        positionStatus
        openDate
        closeDate
        sortDate
        altamiraJobId
        image {
          ...ImageFragment
        }
        allSlugLocales: _allSlugLocales {
          locale
          value
        }
        allTitleLocales: _allTitleLocales {
          locale
          value
        }
        allAbstractLocales: _allAbstractLocales {
          locale
          value
        }
      }
    }
  `,
  [ImageFragment],
);
