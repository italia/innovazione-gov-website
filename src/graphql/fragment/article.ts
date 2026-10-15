import {
  AccordionBlockFragment,
  CalloutFragment,
  DownloadLinkFragment,
  AttachmentsBoxFragment,
  WideLinkCardFragment,
  ExternalLinkFragment,
  ImageBlockFragment,
  AltImageFragment,
  ImageFragment,
  InternalLinkFragment,
  ListBlockquoteFragment,
  ListCardEditorialWithIconFragment,
  ListCardInfoFragment,
  OrderedListFragment,
  QuickLinkCardFragment,
  RelatedArticleFragment,
  ArticleIntroFragment,
  TopicsBlockFragment,
} from "@graphql/fragment/commonFragments";
import { SupportCTASectionFragment } from "@graphql/fragment/sectionFragments";
import { graphql, type FragmentOf } from "@graphql/graphql";

export const ArticleContentFragment = graphql(
  `
    fragment ArticleContentFragment on ArticleModelContentField @_unmask {
      value
      blocks {
        ... on RecordInterface {
          id
          __typename
        }
        ... on ListCardEditorialWithIconRecord {
          ...ListCardEditorialWithIconFragment
        }
        ... on CardServiceRecord {
          card {
            ...ExternalLinkFragment
          }
        }
        ... on OrderedListRecord {
          ...OrderedListFragment
        }
        ... on CalloutRecord {
          ...CalloutFragment
        }
        ... on QuickLinkCardRecord {
          ...QuickLinkCardFragment
        }
        ... on SupportCtaSectionRecord {
          ...SupportCTASectionFragment
        }
        ... on TopicsBlockRecord {
          ...TopicsBlockFragment
        }
        ... on ArticleIntroRecord {
          ...ArticleIntroFragment
        }
        ... on RelatedArticleRecord {
          ...RelatedArticleFragment
        }
        ... on ImageBlockRecord {
          ...ImageBlockFragment
        }
        ... on ListBlockquoteRecord {
          ...ListBlockquoteFragment
        }
        ... on ListCardInfoRecord {
          ...ListCardInfoFragment
        }
        ... on ExternalLinkRecord {
          ...ExternalLinkFragment
        }
        ... on InternalLinkRecord {
          ...InternalLinkFragment
        }
        ... on ListExternalLinkRecord {
          links {
            ...ExternalLinkFragment
          }
        }
        ... on DownloadLinkRecord {
          ...DownloadLinkFragment
        }
        ... on WideLinkCardRecord {
          ...WideLinkCardFragment
        }
        ... on AttachmentsBoxRecord {
          ...AttachmentsBoxFragment
        }
        ... on AccordionBlockRecord {
          ...AccordionBlockFragment
        }
      }
    }
  `,
  [
    AccordionBlockFragment,
    ListCardEditorialWithIconFragment,
    InternalLinkFragment,
    ExternalLinkFragment,
    OrderedListFragment,
    CalloutFragment,
    QuickLinkCardFragment,
    SupportCTASectionFragment,
    ArticleIntroFragment,
    TopicsBlockFragment,
    RelatedArticleFragment,
    ImageBlockFragment,
    ListBlockquoteFragment,
    ListCardInfoFragment,
    DownloadLinkFragment,
    WideLinkCardFragment,
    AttachmentsBoxFragment,
  ],
);

export type ArticleContentFragmentType = FragmentOf<
  typeof ArticleContentFragment
>;

export const AllArticlesRecordFragment = graphql(
  `
    fragment AllArticlesRecordFragment on ArticleRecord @_unmask {
      id
      locales: _locales
      updatedAt: _updatedAt
      publishedAt: _publishedAt
      articleType
      showSidebar
      dateShown
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
      allImageLocales: _allImageLocales {
        locale
        value {
          ...ImageFragment
        }
      }
      allLogoLocales: _allLogoLocales {
        locale
        value {
          ...ImageFragment
        }
      }
      tags {
        name
        slug
        description
        isCategory
        previewImage {
          ...AltImageFragment
        }
      }
      attachments {
        id
        fileTitle
        file {
          url
          filename
          format
          size
        }
      }
      links {
        id
        title
        link
        description
      }
      allContentLocales: _allContentLocales {
        locale
        value {
          ...ArticleContentFragment
        }
      }
    }
  `,
  [ArticleContentFragment, ImageFragment, AltImageFragment],
);

export type AllArticlesRecordFragmentType = FragmentOf<
  typeof AllArticlesRecordFragment
>;
