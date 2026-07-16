import {
  ArticlesLinksQuery,
  CataloguesLinksQuery,
  InsightsLinksQuery,
  PagesLinksQuery,
  SingletonLinksQuery,
  StoriesLinksQuery,
  WebinarsLinksQuery,
} from "@graphql/query/settings";
import { executeAutoPagingQuery, executeQuery } from "@lib/datocms";
import {
  getTitle,
  processItemsCategoryPages,
  processItemsNestedPages,
  processItemsPages,
  processItemsTabPages,
  type LocaleMap,
  type SiteMap,
} from "@utils/linkMap/processItems";

import { isRecordPublished, showAllPages } from "@config/publishedRecords";

import fs from "fs";
import path from "path";

const outputPath = `src/data/linkMap.json`;

// Landing mode: records outside the allowlist stay out of the map, so any
// internal link pointing to them resolves to "#" instead of a 404 URL.
const publishedOnly = <T extends { id: string }>(items: T[]): T[] =>
  items.filter((item) => isRecordPublished(item.id));

async function generateLinkMap() {
  console.log(`Generating link map...`);

  const [
    pagesRes,
    articlesRes,
    insightsRes,
    storiesRes,
    webinarsRes,
    cataloguesRes,
    singletonsRes,
  ] = await Promise.all([
    executeAutoPagingQuery(PagesLinksQuery),
    executeAutoPagingQuery(ArticlesLinksQuery),
    executeAutoPagingQuery(InsightsLinksQuery),
    executeAutoPagingQuery(StoriesLinksQuery),
    executeAutoPagingQuery(WebinarsLinksQuery),
    executeAutoPagingQuery(CataloguesLinksQuery),
    executeQuery(SingletonLinksQuery),
  ]);

  const linkMap: SiteMap = {};
  const home = singletonsRes.homepage;

  if (home) {
    linkMap[home.id] = {} as LocaleMap;
    home.locales.forEach((locale) => {
      linkMap[home.id][locale] = {
        path: `/${locale}`,
        breadcrumb: [],
      };
    });
  }

  const search = showAllPages() ? singletonsRes.search : null;

  if (search) {
    linkMap[search.id] = {} as LocaleMap;
    search.locales.forEach((locale) => {
      linkMap[search.id][locale] = {
        path: `/${locale}/${search.allSlugLocales?.find((t) => t.locale === locale)?.value}`,
        breadcrumb: [],
      };
      if (home) {
        linkMap[search.id][locale].breadcrumb.push({
          title: getTitle(home, locale),
          id: home.id,
        });
      }
      linkMap[search.id][locale].breadcrumb.push({
        title: getTitle(search, locale),
        id: search.id,
      });
    });
  }

  const allowedCatalogues = publishedOnly(cataloguesRes.allCatalogues);

  const collectionPages = [publishedOnly(pagesRes.allPages)];

  collectionPages.forEach((collection) =>
    processItemsPages(collection, linkMap, home),
  );

  const collectionNestedPages = [
    publishedOnly(articlesRes.allArticles),
    allowedCatalogues,
  ];

  collectionNestedPages.forEach((collection) =>
    processItemsNestedPages(collection, linkMap, home),
  );

  const collectionCategoryPages = [publishedOnly(insightsRes.allInsights)];

  collectionCategoryPages.forEach((collection) =>
    processItemsCategoryPages(collection, linkMap, home),
  );

  const collectionTabPages = [
    publishedOnly(storiesRes.allStoryItems),
    publishedOnly(webinarsRes.allWebinarItems),
  ];

  collectionTabPages.forEach((collection) =>
    processItemsTabPages(collection, linkMap, home, allowedCatalogues),
  );

  const fullOutputPath = path.resolve(outputPath);
  if (!fs.existsSync(path.dirname(fullOutputPath))) {
    fs.mkdirSync(path.dirname(fullOutputPath), { recursive: true });
  }

  fs.writeFileSync(fullOutputPath, JSON.stringify(linkMap, null, 2));
  console.log(`Map successfully generated at: ${outputPath}`);
}

async function run() {
  try {
    await generateLinkMap();
    console.log("All link maps generated successfully.");
  } catch (error) {
    console.error("Error generating link maps:", error);
    process.exit(1);
  }
}

run();
