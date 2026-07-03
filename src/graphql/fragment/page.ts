import {
  ExternalLinkFragment,
  ImageFragment,
  InternalLinkFragment,
} from "@graphql/fragment/commonFragments";
import {
  ArticleSTFragment,
  CardLinkListFragment,
  DataSectionRecordFragment,
  FaqSectionRecordFragment,
  GraphitaliaDashboardRecordFragment,
  HeroFragment,
  NewsFeedFragment,
  SupportChannelsSectionFragment,
  SupportCTASectionFragment,
  TextAndAccordionFragment,
  TextAndImageFragment,
  TextAndStatisticsFragment,
  TextOnlyFragment,
  ThirdPartyCookieFragment,
  TopicFilterFragment,
  UseCaseContainerFragment,
} from "@graphql/fragment/sectionFragments";
import { graphql, type FragmentOf } from "@graphql/graphql";

export const PageContentFragment = graphql(
  `
    fragment PageContentFragment on PageModelContentField @_unmask {
      ... on RecordInterface {
        id
        componentName: __typename
      }
      ... on HeroRecord {
        ...HeroFragment
      }
      ... on NewsFeedRecord {
        ...NewsFeedFragment
      }
      ... on SupportChannelsSectionRecord {
        ...SupportChannelsSectionFragment
      }
      ... on FaqSectionRecord {
        ...FaqSectionRecordFragment
      }
      ... on DataSectionRecord {
        ...DataSectionRecordFragment
      }
      ... on GraphitaliaDashboardRecord {
        ...GraphitaliaDashboardRecordFragment
      }
      ... on UseCaseContainerRecord {
        ...UseCaseContainerFragment
      }
      ... on TopicFilterRecord {
        ...TopicFilterFragment
      }
      ... on SupportCtaSectionRecord {
        ...SupportCTASectionFragment
      }
      ... on StructuredTextRecord {
        ...ArticleSTFragment
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
      ... on ThirdPartyCookieRecord {
        ...ThirdPartyCookieFragment
      }
      ... on CarouselRecord {
        id
        slides {
          id
          title
          body(markdown: true)
          image {
            ...ImageFragment
          }
          link {
            ... on CatalogueRecord {
              id
            }
            ... on PageRecord {
              id
            }
          }
          filterCategory {
            label
          }
        }
      }
    }
  `,
  [
    HeroFragment,
    NewsFeedFragment,
    SupportChannelsSectionFragment,
    FaqSectionRecordFragment,
    DataSectionRecordFragment,
    GraphitaliaDashboardRecordFragment,
    UseCaseContainerFragment,
    TopicFilterFragment,
    SupportCTASectionFragment,
    ArticleSTFragment,
    TextAndImageFragment,
    TextAndAccordionFragment,
    TextOnlyFragment,
    CardLinkListFragment,
    TextAndStatisticsFragment,
    ThirdPartyCookieFragment,
    ImageFragment,
    InternalLinkFragment,
    ExternalLinkFragment,
  ],
);

export type PageContentFragmentType = FragmentOf<typeof PageContentFragment>;

export const PageFragment = graphql(
  `
    fragment PageFragment on PageRecord @_unmask {
      id
      locales: _locales
      publishedAt: _publishedAt
      updatedAt: _updatedAt
      allContentLocales: _allContentLocales {
        locale
        value {
          ...PageContentFragment
        }
      }
    }
  `,
  [PageContentFragment],
);

export type PageFragmentType = FragmentOf<typeof PageFragment>;
