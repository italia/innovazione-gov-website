import { buildClient } from "@datocms/cma-client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const COMMIT = process.argv.includes("--commit");
const TARGET_ENV = "website-astro-2026";
const UNDERSECRETARY_OWNER_ID = "56031174";
const SOURCE_MODELS = [
  "article",
  "press_release",
  "interview",
  "participation",
  "focus_page",
];

const from = buildClient({
  apiToken: process.env.DATOCMS_FROM_IMPORT,
  requestTimeout: 60000,
});
const to = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: TARGET_ENV,
  requestTimeout: 60000,
});

const slugOf = (record) =>
  record.slug && typeof record.slug === "object"
    ? (record.slug.it ?? "")
    : (record.slug ?? "");

async function listAll(client, filter) {
  const items = [];
  for await (const item of client.items.listPagedIterator({
    filter,
    version: "current",
    nested: true,
  }))
    items.push(item);
  return items;
}

console.log(
  COMMIT
    ? `SET undersecretary -> ${TARGET_ENV} (scritture attive)`
    : `DRY-RUN undersecretary -> ${TARGET_ENV} (usa --commit per scrivere)`,
);

const sourceTypes = await from.itemTypes.list();
const ownedSlugs = new Set();
for (const apiKey of SOURCE_MODELS) {
  const model = sourceTypes.find((type) => type.api_key === apiKey);
  if (!model) continue;
  for (const record of await listAll(from, { type: model.id }))
    if ((record.owners ?? []).includes(UNDERSECRETARY_OWNER_ID))
      ownedSlugs.add(slugOf(record));
}
console.log(`sorgente: ${ownedSlugs.size} record con owner Sottosegretario`);

const articleModel = (await to.itemTypes.list()).find(
  (type) => type.api_key === "article",
);
const articles = await listAll(to, { type: articleModel.id });

const toFlag = articles.filter(
  (article) => !article.undersecretary && ownedSlugs.has(slugOf(article)),
);
const byType = toFlag.reduce(
  (tally, article) => ({
    ...tally,
    [article.article_type]: (tally[article.article_type] ?? 0) + 1,
  }),
  {},
);
console.log(
  `destinazione: ${articles.length} articoli, ${toFlag.length} da marcare`,
  byType,
);

for (const article of toFlag) {
  console.log(
    `${COMMIT ? "marcato" : "[dry]"} ${article.article_type.padEnd(14)} ${slugOf(article)}`,
  );
  if (!COMMIT) continue;
  await to.items.update(article.id, { undersecretary: true });
  if (article.meta.status !== "draft") await to.items.publish(article.id);
}
