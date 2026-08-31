import {
  ArticlesLinksQuery,
  CataloguesLinksQuery,
  InsightsLinksQuery,
  PagesLinksQuery,
  SingletonLinksQuery,
  WebinarsLinksQuery,
} from "@graphql/query/settings";
import { JobPositionsLinksQuery } from "@graphql/query/jobPosition";
import type { SiteLocale } from "@graphql/types";
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
    webinarsRes,
    cataloguesRes,
    jobPositionsRes,
    singletonsRes,
  ] = await Promise.all([
    executeAutoPagingQuery(PagesLinksQuery),
    executeAutoPagingQuery(ArticlesLinksQuery),
    executeAutoPagingQuery(InsightsLinksQuery),
    executeAutoPagingQuery(WebinarsLinksQuery),
    executeAutoPagingQuery(CataloguesLinksQuery),
    executeAutoPagingQuery(JobPositionsLinksQuery),
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

  const SECTION_PATH_BY_TYPE: Record<string, string> = {
    news: "novita/notizie",
    press_release: "novita/comunicati-stampa",
    focus: "novita/focus",
    guida: "novita/guide",
  };

  const findSectionEntry = (locale: SiteLocale, sectionPath: string) => {
    const full = `/${locale}/${sectionPath}`;
    for (const recordId of Object.keys(linkMap)) {
      const entry = linkMap[recordId][locale];
      if (entry?.path === full) return entry;
    }
    return null;
  };

  for (const article of publishedOnly(articlesRes.allArticles)) {
    const sectionPath = SECTION_PATH_BY_TYPE[article.articleType ?? ""];
    if (!sectionPath) continue;
    for (const locale of article.locales) {
      const section = findSectionEntry(locale, sectionPath);
      const current = linkMap[article.id]?.[locale];
      if (!section || !current) continue;
      const articleSlug = current.path.split("/").pop();
      linkMap[article.id][locale] = {
        path: `${section.path}/${articleSlug}`,
        breadcrumb: [
          ...section.breadcrumb,
          { title: getTitle(article, locale), id: article.id },
        ],
      };
    }
  }

  // Le posizioni lavorative stanno sotto la pagina di archivio: resolveRoutePath
  // risale parentPage (posizione → archivio → pagina), e il breadcrumb tiene
  // tutti i livelli come per le pagine.
  processItemsPages(
    publishedOnly(jobPositionsRes.allJobPositions),
    linkMap,
    home,
  );

  const collectionCategoryPages = [publishedOnly(insightsRes.allInsights)];

  collectionCategoryPages.forEach((collection) =>
    processItemsCategoryPages(collection, linkMap, home),
  );

  const collectionTabPages = [publishedOnly(webinarsRes.allWebinarItems)];

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
