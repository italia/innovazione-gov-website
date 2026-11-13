import {
  AltImageFragment,
  CalloutFragment,
  ListCollectionFragment,
} from "@graphql/fragment/commonFragments";
import {
  CatalogueLocalesFragment,
  PageLocalesFragment,
  SearchLocalesFragment,
} from "@graphql/fragment/metaFragments";
import {
  ArticleSTFragment,
  CardLinkListFragment,
  FaqSectionRecordFragment,
  HeroFragment,
  IntroArticleFragment,
  SupportChannelsSectionFragment,
  SupportCTASectionFragment,
  TextAndAccordionFragment,
  TextAndImageFragment,
  TextAndStatisticsFragment,
  TextAndUseCasesFragment,
  TextOnlyFragment,
} from "@graphql/fragment/sectionFragments";
import { graphql, type FragmentOf } from "@graphql/graphql";

export const AnnouncementLocalesFragment = graphql(
  `
    fragment AnnouncementLocalesFragment on AnnouncementRecord @_unmask {
      allSlugLocales: _allSlugLocales {
        locale
        value
      }
      allTitleLocales: _allTitleLocales {
        locale
        value
      }
    }
  `,
  [],
);

export const AllAnnouncementsSlugFragment = graphql(
  `
    fragment AllAnnouncementsSlugFragment on AnnouncementRecord @_unmask {
      id
      modelApiKey: _modelApiKey
      locales: _locales
      ...AnnouncementLocalesFragment
      parentPage {
        ... on RecordInterface {
          id
        }
        ... on IndexPageRecord {
          ...CatalogueLocalesFragment
          parentPage {
            ... on PageRecord {
              id
              ...PageLocalesFragment
            }
            ... on SearchRecord {
              id
              ...SearchLocalesFragment
            }
          }
        }
        ... on InsightRecord {
          allSlugLocales: _allSlugLocales {
            locale
            value
          }
          allTitleLocales: _allTitleLocales {
            locale
            value
          }
          parentPage {
            ... on PageRecord {
              id
              ...PageLocalesFragment
            }
          }
        }
        ... on PageRecord {
          ...PageLocalesFragment
        }
      }
    }
  `,
  [
    AnnouncementLocalesFragment,
    CatalogueLocalesFragment,
    PageLocalesFragment,
    SearchLocalesFragment,
  ],
);

export type AllAnnouncementsSlugFragmentType = FragmentOf<
  typeof AllAnnouncementsSlugFragment
>;

export const AnnouncementContentFragment = graphql(
  `
    fragment AnnouncementContentFragment on AnnouncementModelContentField
    @_unmask {
      ... on RecordInterface {
        id
        componentName: __typename
      }
      ... on HeroRecord {
        ...HeroFragment
      }
      ... on FaqSectionRecord {
        ...FaqSectionRecordFragment
      }
      ... on StructuredTextRecord {
        ...ArticleSTFragment
      }
      ... on ListCollectionRecord {
        ...ListCollectionFragment
      }
      ... on SupportChannelsSectionRecord {
        ...SupportChannelsSectionFragment
      }
      ... on SupportCtaSectionRecord {
        ...SupportCTASectionFragment
      }
      ... on TextImageRecord {
        ...TextAndImageFragment
      }
      ... on TextAccordionRecord {
        ...TextAndAccordionFragment
      }
      ... on TextOnlyRecord {
        ...TextOnlyFragment
      }
      ... on CardLinkListRecord {
        ...CardLinkListFragment
      }
      ... on TextStatisticRecord {
        ...TextAndStatisticsFragment
      }
      ... on TextUseCaseRecord {
        ...TextAndUseCasesFragment
      }
      ... on IntroArticleRecord {
        ...IntroArticleFragment
      }
    }
  `,
  [
    FaqSectionRecordFragment,
    HeroFragment,
    ListCollectionFragment,
    CalloutFragment,
    ArticleSTFragment,
    SupportChannelsSectionFragment,
    TextAndImageFragment,
    TextAndAccordionFragment,
    TextOnlyFragment,
    CardLinkListFragment,
    TextAndStatisticsFragment,
    TextAndUseCasesFragment,
    SupportCTASectionFragment,
    IntroArticleFragment,
  ],
);

export type AnnouncementContentFragmentType = FragmentOf<
  typeof AnnouncementContentFragment
>;

export const AllAnnouncementsRecordFragment = graphql(
  `
    fragment AllAnnouncementsRecordFragment on AnnouncementRecord @_unmask {
      id
      locales: _locales
      publishedAt: _publishedAt
      updatedAt: _updatedAt
      announcementCategory
      announcementStatus
      openDate
      closeDate
      sortDate
      showDateAfterClosed
      showSidebar
      image {
        ...AltImageFragment
      }
      allOfficeLocales: _allOfficeLocales {
        locale
        value
      }
      allOfficeLinkLocales: _allOfficeLinkLocales {
        locale
        value
      }
      allTopicsLocales: _allTopicsLocales {
        locale
        value {
          id
          name
          slug
          isHighlighted
        }
      }
      allTitleLocales: _allTitleLocales {
        locale
        value
      }
      allAbstractLocales: _allAbstractLocales {
        locale
        value
      }
      allContentLocales: _allContentLocales {
        locale
        value {
          ...AnnouncementContentFragment
        }
      }
    }
  `,
  [AnnouncementContentFragment, AltImageFragment],
);

export type AllAnnouncementsRecordFragmentType = FragmentOf<
  typeof AllAnnouncementsRecordFragment
>;
