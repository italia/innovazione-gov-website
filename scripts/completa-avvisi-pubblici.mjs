import { buildBlockRecord, buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const TARGET_ENV = "website-astro-2026";
const LOCALE = "it";
const INDEX_PAGE = "DIuaTvKQTe6jQ6zno0XQ9g";
const TAB_TYPE = "announcement";
const COMMIT = process.argv.includes("--commit");

const client = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: TARGET_ENV,
  requestTimeout: 120000,
});

const itemTypes = await client.itemTypes.list();
const typeId = (apiKey) => {
  const found = itemTypes.find((itemType) => itemType.api_key === apiKey);
  if (!found) throw new Error(`modello ${apiKey} non trovato`);
  return found.id;
};

const nestedPage = await client.items.find(INDEX_PAGE, { nested: true });
const nestedBlocks = nestedPage.content?.[LOCALE] ?? [];

const hasFeed = nestedBlocks.some(
  (block) =>
    block.relationships?.item_type?.data?.id === typeId("catalogue_feed"),
);

if (hasFeed) {
  console.log("il feed è già presente sulla pagina indice");
  process.exit(0);
}

const feed = buildBlockRecord({
  item_type: { type: "item_type", id: typeId("catalogue_feed") },
  background_color: "default",
  tabs: [
    buildBlockRecord({
      item_type: { type: "item_type", id: typeId("catalogue_tab") },
      title: "Avvisi pubblici",
      paragraph: "Esplora tutti gli avvisi o filtra per argomento",
      filter_style: '[\n  "pills"\n]',
      filter_title: "Argomenti in evidenza",
      label_for_all: "Tutti",
      news_page_tab_type: TAB_TYPE,
      story_type: "",
      filter_story: null,
      element_per_page: 12,
      filter_owner: null,
    }),
  ],
});

if (!COMMIT) {
  console.log("[dry] da aggiungere il feed degli avvisi alla pagina indice");
  process.exit(0);
}

const page = await client.items.find(INDEX_PAGE);
const blockIds = page.content?.[LOCALE] ?? [];

await client.items.update(INDEX_PAGE, {
  content: { [LOCALE]: [...blockIds, feed] },
});
await client.items.publish(INDEX_PAGE);
console.log("feed aggiunto e pagina indice ripubblicata");
