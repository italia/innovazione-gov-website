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
  HighlightCarouselFragment,
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
  TopicHighlightFragment,
  TopicListFragment,
  TopicFilterFragment,
  UseCaseContainerFragment,
  LinkMenuFragment,
} from "@graphql/fragment/sectionFragments";
import { graphql, type FragmentOf } from "@graphql/graphql";

export const SearchBarFragment = graphql(`
  fragment SearchBarFragment on SearchBarRecord @_unmask {
    title
    labelForNoResult
    labelForAllResult
    labelButton
    inputPlaceholder
  }
`);

export type SearchBarFragmentType = FragmentOf<typeof SearchBarFragment>;

export const SearchPageContentFragment = graphql(
  `
    fragment SearchPageContentFragment on SearchModelContentField @_unmask {
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
      ... on HighlightCarouselRecord {
        ...HighlightCarouselFragment
      }
      ... on SearchBarRecord {
        ...SearchBarFragment
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
      ... on TopicHighlightRecord {
        ...TopicHighlightFragment
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
    SearchBarFragment,
    HeroFragment,
    HighlightCarouselFragment,
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
    TopicHighlightFragment,
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

export type SearchPageContentFragmentType = FragmentOf<
  typeof SearchPageContentFragment
>;

export const SearchRecordFragment = graphql(
  `
    fragment SearchRecordFragment on SearchRecord @_unmask {
      id
      locales: _locales
      publishedAt: _publishedAt
      updatedAt: _updatedAt
      allContentLocales: _allContentLocales {
        locale
        value {
          ...SearchPageContentFragment
        }
      }
    }
  `,
  [SearchPageContentFragment],
);

export type SearchRecordFragmentType = FragmentOf<typeof SearchRecordFragment>;
