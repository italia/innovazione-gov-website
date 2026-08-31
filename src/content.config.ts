import {
  allDocumentsLoader,
  articleContentLoader,
  cataloguesLoader,
  errorPageLoader,
  globalSeoLoader,
  globalSettingsLoader,
  homepageLoader,
  insightContentLoader,
  jobPositionsLoader,
  layoutLoader,
  localesLoader,
  measuresLoader,
  newsLoader,
  pagesLoader,
  resourcesLoader,
  searchLoader,
  sidebarLoader,
  siteMetaTagsLoader,
  webinarContentLoader,
  webinarsLoader,
} from "@collections/loader";
import {
  allDocumentsSchema,
  articleSchema,
  catalogueSchema,
  errorPageSchema,
  globalSeoSchema,
  globalSettingsSchema,
  homepageSchema,
  insightSchema,
  jobPositionSchema,
  layoutSchema,
  localesSchema,
  measureSchema,
  newsSchema,
  pageSchema,
  resourceSchema,
  searchSchema,
  sidebarSchema,
  siteMetaTagsSchema,
  webinarContentSchema,
  webinarSchema,
} from "@collections/schema";
import { defineCollection } from "astro:content";

export const collections = {
  news_item: defineCollection({
    schema: newsSchema,
    loader: newsLoader,
  }),
  webinar_item: defineCollection({
    schema: webinarSchema,
    loader: webinarsLoader,
  }),
  resource: defineCollection({
    schema: resourceSchema,
    loader: resourcesLoader,
  }),
  measure: defineCollection({
    schema: measureSchema,
    loader: measuresLoader,
  }),
  global_settings: defineCollection({
    schema: globalSettingsSchema,
    loader: globalSettingsLoader,
  }),
  page: defineCollection({
    schema: pageSchema,
    loader: pagesLoader,
  }),
  homepage: defineCollection({
    schema: homepageSchema,
    loader: homepageLoader,
  }),
  search: defineCollection({
    schema: searchSchema,
    loader: searchLoader,
  }),
  catalogue: defineCollection({
    schema: catalogueSchema,
    loader: cataloguesLoader,
  }),
  webinar_content: defineCollection({
    schema: webinarContentSchema,
    loader: webinarContentLoader,
  }),
  insight: defineCollection({
    schema: insightSchema,
    loader: insightContentLoader,
  }),
  job_position: defineCollection({
    schema: jobPositionSchema,
    loader: jobPositionsLoader,
  }),
  article: defineCollection({
    schema: articleSchema,
    loader: articleContentLoader,
  }),
  layout: defineCollection({
    schema: layoutSchema,
    loader: layoutLoader,
  }),
  sidebar: defineCollection({
    schema: sidebarSchema,
    loader: sidebarLoader,
  }),
  locales: defineCollection({
    schema: localesSchema,
    loader: localesLoader,
  }),
  error_page: defineCollection({
    schema: errorPageSchema,
    loader: errorPageLoader,
  }),
  site_meta: defineCollection({
    schema: siteMetaTagsSchema,
    loader: siteMetaTagsLoader,
  }),
  global_seo: defineCollection({
    schema: globalSeoSchema,
    loader: globalSeoLoader,
  }),
  documents: defineCollection({
    loader: allDocumentsLoader,
    schema: allDocumentsSchema,
  }),
};
