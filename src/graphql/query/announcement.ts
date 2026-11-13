import {
  AllAnnouncementsRecordFragment,
  AllAnnouncementsSlugFragment,
} from "@graphql/fragment/announcement";
import { TagFragment } from "@graphql/fragment/commonFragments";
import { SeoFieldFragment } from "@graphql/fragment/seoFragments";
import { graphql } from "@graphql/graphql";

export const AllAnnouncementsContentQuery = graphql(
  `
    query AllAnnouncementsContentQuery {
      allAnnouncements(first: 500) {
        ...AllAnnouncementsRecordFragment
      }
    }
  `,
  [AllAnnouncementsRecordFragment],
);

export const AnnouncementsLinksQuery = graphql(
  `
    query AnnouncementsLinks {
      allAnnouncements(first: 500) {
        ...AllAnnouncementsSlugFragment
      }
    }
  `,
  [AllAnnouncementsSlugFragment],
);

export const AnnouncementsSeoQuery = graphql(
  `
    query AnnouncementsSeo($locale: SiteLocale!) {
      allAnnouncements(locale: $locale, first: 500) {
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
