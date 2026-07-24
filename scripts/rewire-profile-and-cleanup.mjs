/**
 * Fase 2b (#2 + #3):
 *  - ri-cabla le preview del profilo (news_feed/story_tab) dai gemelli story_item
 *    ai record dei modelli distinti (per slug): Interviste->interview,
 *    Interventi->participation, Comunicati stampa->press_release. Notizie resta story_item.
 *  - cancella gli story_item gemelli (classi Interviste/Interventi/Comunicati).
 *
 * Uso: node scripts/rewire-profile-and-cleanup.mjs [--commit]
 * Idempotente.
 */
import { buildClient } from "@datocms/cma-client";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const COMMIT = process.argv.includes("--commit");
const ENV = "website-astro-2026";
const to = buildClient({ apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN, environment: ENV, requestTimeout: 60000 });
const val = (f, l) => (f == null ? "" : typeof f === "object" ? (f[l] ?? "") : l === "it" ? f : "");

// titolo preview -> { model, storyClass }
const PREVIEW = {
  Interviste: { model: "interview", storyClass: "Interviste" },
  Interventi: { model: "participation", storyClass: "Interventi" },
  "Comunicati stampa": { model: "press_release", storyClass: "Comunicati stampa" },
};

const its = await to.itemTypes.list();
const byId = Object.fromEntries(its.map((i) => [i.id, i.api_key]));
const byKey = Object.fromEntries(its.map((i) => [i.api_key, i]));

async function listAll(modelId) {
  const r = [];
  for await (const x of to.items.listPagedIterator({ filter: { type: modelId }, version: "current", perPage: 100 })) r.push(x);
  return r;
}

// mappe di supporto
const storyItems = await listAll(byKey["story_item"].id);
const storyIdToSlug = new Map(storyItems.map((r) => [r.id, val(r.slug, "it")]));
const slugToDistinctId = {}; // model -> Map(slug -> id)
const firstN = {}; // model -> primi 3 id (fallback per preview non mappabili)
for (const { model } of Object.values(PREVIEW)) {
  if (slugToDistinctId[model]) continue;
  const rows = await listAll(byKey[model].id);
  slugToDistinctId[model] = new Map(rows.map((r) => [val(r.slug, "it"), r.id]));
  firstN[model] = rows.slice(0, 3).map((r) => r.id);
}

// [#2] ri-cablaggio preview profilo
console.log(`[#2] ri-cablaggio preview profilo  [${COMMIT ? "COMMIT" : "DRY"}]`);
const PAGE = byKey["page"].id;
function rebuild(b) {
  const key = byId[b.relationships.item_type.data.id];
  const attributes = { ...b.attributes };
  if (key === "news_feed") {
    const title = val(b.attributes.title, "it");
    const map = PREVIEW[title];
    attributes.tabs = (b.attributes.tabs || []).map((t) => rebuild(t));
    // marca il titolo target per il figlio story_tab
    attributes.__previewModel = map?.model;
  }
  if (key === "story_tab") {
    // il modello target viene passato via chiusura sul news_feed: lo deduciamo dal title del tab
    const title = val(b.attributes.title, "it");
    const map = PREVIEW[title];
    if (map) {
      const ids = (b.attributes.news || [])
        .map((sid) => slugToDistinctId[map.model].get(storyIdToSlug.get(sid)))
        .filter(Boolean);
      // fallback: se nessun link si mappa (slug drift), usa i primi record del modello
      attributes.news = ids.length ? ids : firstN[map.model] || [];
    }
  }
  const out = { type: "item", id: b.id, attributes, relationships: b.relationships };
  delete out.attributes.__previewModel;
  return out;
}

for await (const p of to.items.listPagedIterator({ filter: { type: PAGE }, version: "current", nested: true, perPage: 100 })) {
  if (val(p.slug, "it") !== "sottosegretario") continue;
  const summary = [];
  for (const loc of Object.keys(p.content)) {
    for (const b of p.content[loc]) {
      if (byId[b.relationships.item_type.data.id] !== "news_feed") continue;
      const title = val(b.attributes.title, "it");
      const tab = (b.attributes.tabs || [])[0];
      if (PREVIEW[title] && tab) {
        const mapped = (tab.attributes.news || []).map((sid) => slugToDistinctId[PREVIEW[title].model].get(storyIdToSlug.get(sid))).filter(Boolean);
        summary.push(`${loc}/${title}: ${(tab.attributes.news || []).length} -> ${mapped.length} (${PREVIEW[title].model})`);
      }
    }
  }
  console.log("  preview:", summary.join(" | "));
  if (COMMIT) {
    const content = {};
    for (const loc of Object.keys(p.content)) content[loc] = p.content[loc].map(rebuild);
    await to.items.update(p.id, { content });
    await to.items.publish(p.id);
    console.log("  profilo aggiornato + pubblicato");
  }
}

// [#3] cancellazione story_item gemelli
console.log(`\n[#3] cancellazione story_item gemelli`);
const SC = byKey["story_class"].id;
const classId = {};
for (const c of await listAll(SC)) classId[val(c.label, "it")] = c.id;
const delClasses = new Set(Object.values(PREVIEW).map((p) => classId[p.storyClass]));
const targets = storyItems.filter((r) => delClasses.has(val(r.article_classification, "it")));
console.log(`  story_item da cancellare (Interviste/Interventi/Comunicati): ${targets.length}`);
if (COMMIT) {
  let del = 0;
  for (const r of targets) {
    try { await to.items.destroy(r.id); del++; }
    catch (e) { console.log(`  ! non cancellato ${val(r.slug, "it")}: ${String(e.message).slice(0, 60)}`); }
  }
  console.log(`  cancellati: ${del}`);
}
console.log(COMMIT ? "\nFATTO" : "\n(dry) rilancia con --commit");
