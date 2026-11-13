import type {
  AnnouncementIndexingFragmentType,
  ArticleIndexingFragmentType,
  InsightIndexingFragmentType,
  NewsIndexingFragmentType,
  PageIndexingFragmentType,
  ResourseIndexingFragmentType,
  WebinarIndexingFragmentType,
} from "@graphql/fragment/indexing";
import type { SiteLocale } from "@graphql/types";
import { DatoBlockModel } from "@utils/cmsMapper";
import { createDownloadUrl } from "@utils/createDownloadUrl";
import { getLocaleValue } from "@utils/getLocaleValue";
import {
  flattenBlocks,
  getSearchRenderOptions,
} from "@utils/indexing/blockContentMappers";
import { getBreadcrumbs, linkResolver } from "@utils/linkResolver";
import { contentLabel } from "@utils/storyClassification";
import { render } from "datocms-structured-text-to-plain-text";

export const getSectionLabel = (
  id: string,
  lang: SiteLocale,
  override?: string | null,
): string => {
  const scelta = (override ?? "").trim();
  if (scelta) return scelta;
  const breadcrumb = getBreadcrumbs(id, lang);
  const sezione = breadcrumb.length > 1 ? breadcrumb[1] : null;
  return sezione && sezione.id !== id ? sezione.title.trim() : "";
};

export const getMapAnnouncement = (
  announcement: AnnouncementIndexingFragmentType,
  lang: SiteLocale,
  category: string,
) => {
  const contentData = getLocaleValue(
    announcement.allContentLocales,
    lang,
    null,
  );

  return {
    type: "announcement",
    id: announcement.id,
    category,
    internalLink: linkResolver(announcement.id, lang),
    title: getLocaleValue(announcement.allTitleLocales, lang, ""),
    description: getLocaleValue(announcement.allAbstractLocales, lang, ""),
    content: flattenBlocks(contentData ?? []),
  };
};

export const getMapArticle = (
  article: ArticleIndexingFragmentType,
  lang: SiteLocale,
) => {
  const structuredText = getLocaleValue(article.allContentLocales, lang, null);

  const stOptions = getSearchRenderOptions();

  return {
    type: "article",
    id: article.id,
    category: contentLabel(article.articleType, article.contentType),
    internalLink: linkResolver(article.id, lang),
    title: getLocaleValue(article.allTitleLocales, lang, ""),
    description: getLocaleValue(article.allParagraphLocales, lang, ""),
    content: render(structuredText, stOptions),
  };
};

export const getMapInsight = (
  insight: InsightIndexingFragmentType,
  lang: SiteLocale,
) => {
  const contentData = getLocaleValue(insight.allContentLocales, lang, null);

  const content = flattenBlocks(contentData ?? []);
  return {
    type: "insight",
    id: insight.id,
    category: getSectionLabel(insight.id, lang, insight.contentType),
    internalLink: linkResolver(insight.id, lang),
    title: getLocaleValue(insight.allTitleLocales, lang, ""),
    description: getLocaleValue(insight.allAbstractLocales, lang, ""),
    content: content,
  };
};

export const getMapWebinar = (
  webinar: WebinarIndexingFragmentType,
  lang: SiteLocale,
) => {
  const contentData = getLocaleValue(webinar.allContentLocales, lang, null);
  const content = flattenBlocks(contentData ?? []);

  return {
    type: "webinar",
    id: webinar.id,
    category: getSectionLabel(webinar.id, lang, webinar.contentType),
    internalLink: linkResolver(webinar.id, lang),
    title: getLocaleValue(webinar.allTitleLocales, lang, ""),
    description: getLocaleValue(webinar.allParagraphLocales, lang, ""),
    content: content,
  };
};

export const getMapNews = (
  news: NewsIndexingFragmentType,
  lang: SiteLocale,
  category: string,
) => {
  return {
    type: "news",
    id: news.id,
    category,
    externalLink: getLocaleValue(news.allLinkLocales, lang, ""),
    title: getLocaleValue(news.allTitleLocales, lang, ""),
    description: getLocaleValue(news.allParagraphLocales, lang, ""),
    content: getLocaleValue(news.allParagraphLocales, lang, ""),
  };
};

export const getMapResourse = (
  resourse: ResourseIndexingFragmentType,
  lang: SiteLocale,
  category: string,
) => {
  const block = getLocaleValue(resourse.allResourseLocales, lang, null);

  if (!block) return null;

  switch (block.componentName) {
    case DatoBlockModel.ExternalLink:
      return {
        type: "resourse",
        id: resourse.id,
        category,
        externalLink: block.url,
        title: block.label,
        description: block.description,
        content: block.description,
      };
    case DatoBlockModel.DownloadLink:
      return {
        type: "resourse",
        id: resourse.id,
        category,
        downloadLink: createDownloadUrl(block.doc),
        title: block.label,
        description: block.description,
        content: block.description,
      };
    default:
      return null;
  }
};

export const getMapPages = (
  page: PageIndexingFragmentType,
  lang: SiteLocale,
) => {
  const contentData = getLocaleValue(page.allContentLocales, lang, []);

  const content = flattenBlocks(contentData);
  return {
    type: "page",
    id: page.id,
    category: getSectionLabel(page.id, lang, page.contentType),
    internalLink: linkResolver(page.id, lang),
    title: getLocaleValue(page.allTitleLocales, lang, ""),
    description: "",
    content: content,
  };
};
