import {
  ChartFragment,
  ExternalLinkFragment,
  ImageFragment,
  InternalLinkFragment,
  KpiFragment,
  ListCardEditorialWithIconWrapperFragment,
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
  TextDonutFragment,
  TextOnlyFragment,
  TimelineFragment,
  ThirdPartyCookieFragment,
  TopicListFragment,
  TopicFilterFragment,
  UseCaseContainerFragment,
  LinkMenuFragment,
} from "@graphql/fragment/sectionFragments";
import { graphql, type FragmentOf } from "@graphql/graphql";

export const PageContentFragment = graphql(
  `
    fragment PageContentFragment on PageModelContentField @_unmask {
      ... on RecordInterface {
        id
        componentName: __typename
      }
      ... on TextDonutRecord {
        ...TextDonutFragment
      }
      ... on SettingsChartRecord {
        ...ChartFragment
      }
      ... on SettingsKpiRecord {
        ...KpiFragment
      }
      ... on ListCardEditorialWithIconWrapperRecord {
        ...ListCardEditorialWithIconWrapperFragment
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
      ... on LinkMenuRecord {
        ...LinkMenuFragment
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
      ... on TimelineRecord {
        ...TimelineFragment
      }
      ... on TopicListRecord {
        ...TopicListFragment
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
            ... on IndexPageRecord {
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
    LinkMenuFragment,
    TextAndAccordionFragment,
    TextOnlyFragment,
    CardLinkListFragment,
    TextAndStatisticsFragment,
    TimelineFragment,
    TopicListFragment,
    ThirdPartyCookieFragment,
    ImageFragment,
    InternalLinkFragment,
    ExternalLinkFragment,
    TextDonutFragment,
    ChartFragment,
    KpiFragment,
    ListCardEditorialWithIconWrapperFragment,
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
      showSectionsNav
      sectionsNavLayout
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
