/**
 * Imposta news_page_tab_type sul catalogue_tab degli archivi index_page, così
 * ogni archivio elenca il modello distinto giusto (invece di story_item).
 * Idempotente. Uso: node scripts/set-archive-tabtype.mjs [--commit]
 */
import { buildClient } from "@datocms/cma-client";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const COMMIT = process.argv.includes("--commit");
const ENV = "website-astro-2026";
// archivio slug -> news_page_tab_type
const MAP = {
  interviste: "interview",
  // interventi: "participation",       // abilitare dopo aver replicato la pipeline
  // "comunicati-stampa": "press_release",
  // focus: "focus_page",
};

const to = buildClient({ apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN, environment: ENV, requestTimeout: 60000 });
const val = (f, l) => (f == null ? "" : typeof f === "object" ? (f[l] ?? "") : l === "it" ? f : "");
const its = await to.itemTypes.list();
const byId = Object.fromEntries(its.map((i) => [i.id, i.api_key]));
const IP = its.find((i) => i.api_key === "index_page").id;

function rebuild(b, tabType) {
  const key = byId[b.relationships.item_type.data.id];
  const attributes = { ...b.attributes };
  if (key === "catalogue_feed") attributes.tabs = (b.attributes.tabs || []).map((t) => rebuild(t, tabType));
  if (key === "catalogue_tab") attributes.news_page_tab_type = tabType;
  return { type: "item", id: b.id, attributes, relationships: b.relationships };
}

for await (const p of to.items.listPagedIterator({ filter: { type: IP }, version: "current", nested: true, perPage: 50 })) {
  const slug = val(p.slug, "it");
  const tabType = MAP[slug];
  if (!tabType) continue;
  console.log(`  ${COMMIT ? "set" : "[dry]"} "${slug}" news_page_tab_type=${tabType}`);
  if (COMMIT) {
    const content = {};
    for (const loc of Object.keys(p.content)) content[loc] = (p.content[loc] || []).map((b) => rebuild(b, tabType));
    await to.items.update(p.id, { content });
    await to.items.publish(p.id);
  }
}
console.log(COMMIT ? "FATTO" : "(dry) rilancia con --commit");
