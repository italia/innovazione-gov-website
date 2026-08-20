import {
  CalloutFragment,
  ListCollectionFragment,
} from "@graphql/fragment/commonFragments";
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
import { PageLocalesFragment } from "@graphql/fragment/metaFragments";
import { graphql, type FragmentOf } from "@graphql/graphql";

/**
 * Slug e titolo per locale: serve a resolveRoutePath per costruire URL e
 * breadcrumb risalendo la catena posizione → archivio → pagina.
 */
export const JobPositionLocalesFragment = graphql(
  `
    fragment JobPositionLocalesFragment on JobPositionRecord @_unmask {
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

/**
 * L'archivio è un record "Articoli e sottopagine" che a sua volta ha una
 * pagina genitore: entrambi i livelli servono per l'URL completo.
 */
export const AllJobPositionsSlugFragment = graphql(
  `
    fragment AllJobPositionsSlugFragment on JobPositionRecord @_unmask {
      id
      modelApiKey: _modelApiKey
      locales: _locales
      ...JobPositionLocalesFragment
      parentPage {
        ... on RecordInterface {
          id
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
            id
            ...PageLocalesFragment
          }
        }
        ... on PageRecord {
          ...PageLocalesFragment
        }
      }
    }
  `,
  [JobPositionLocalesFragment, PageLocalesFragment],
);

export type AllJobPositionsSlugFragmentType = FragmentOf<
  typeof AllJobPositionsSlugFragment
>;

/**
 * Stessi blocchi del content delle sottopagine, ma su JobPositionModelContentField:
 * l'unione del campo è diversa (non ammette l'elenco delle posizioni), quindi il
 * fragment degli insight non può essere riusato qui.
 */
export const JobPositionContentFragment = graphql(
  `
    fragment JobPositionContentFragment on JobPositionModelContentField
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

export type JobPositionContentFragmentType = FragmentOf<
  typeof JobPositionContentFragment
>;

export const AllJobPositionsRecordFragment = graphql(
  `
    fragment AllJobPositionsRecordFragment on JobPositionRecord @_unmask {
      id
      locales: _locales
      publishedAt: _publishedAt
      updatedAt: _updatedAt
      positionStatus
      openDate
      closeDate
      allTitleLocales: _allTitleLocales {
        locale
        value
      }
      allAbstractLocales: _allAbstractLocales {
        locale
        value
      }
      allCompensationLocales: _allCompensationLocales {
        locale
        value
      }
      allContentLocales: _allContentLocales {
        locale
        value {
          ...JobPositionContentFragment
        }
      }
    }
  `,
  [JobPositionContentFragment],
);

export type AllJobPositionsRecordFragmentType = FragmentOf<
  typeof AllJobPositionsRecordFragment
>;
