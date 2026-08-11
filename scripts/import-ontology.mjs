/**
 * Ontologia — porta le tassonomie del vecchio Dato (DATOCMS_FROM_IMPORT) su
 * `website-astro-2026`, facendo match con l'esistente e aggiungendo il mancante.
 *
 * Fase A — vocabolario:
 *   - tassonomia `owner` (Ministro/Sottosegretario/Dipartimento/Italia 2026)
 *   - tassonomia `target` (dai record `target` sorgente)
 *   - estende `story_topic` con i tag (Argomento) sorgente (match label + add)
 * Fase B — campi schema (links, non localizzati):
 *   - story_item: owners(→owner), topics(→story_topic), targets(→target)
 *   - focus_page: topics(→story_topic), targets(→target)
 * Fase C — ri-tagging contenuti (per slug, dal sorgente): story_item + focus_page.
 *
 * Uso:  node scripts/import-ontology.mjs [--commit]
 * Idempotente: modelli/campi/valori per label o api_key; lookup version:"current".
 */
import { buildClient } from "@datocms/cma-client";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const COMMIT = process.argv.includes("--commit");
const ENV = "website-astro-2026";

const from = buildClient({
  apiToken: process.env.DATOCMS_FROM_IMPORT,
  requestTimeout: 60000,
});
const to = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: ENV,
  requestTimeout: 60000,
});

// ---- helpers ---------------------------------------------------------------
const val = (f, l) =>
  f == null ? "" : typeof f === "object" ? (f[l] ?? "") : l === "it" ? f : "";
const norm = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
const tryPublish = async (id) => {
  try {
    await to.items.publish(id);
  } catch {
    /* modello senza draft */
  }
};

// Alias per evitare quasi-duplicati con valori story_topic già curati.
const TOPIC_ALIAS = { maas: "Mobility as a Service for Italy" };

// Owner: id pagina-figura sorgente -> label owner destinazione
const OWNER_LABEL = {
  47675519: "Ministro",
  56031174: "Sottosegretario",
  47676614: "Dipartimento",
  47675584: "Italia 2026",
};

const CATEGORIES = [
  { label: "Notizie", source: "article" },
  { label: "Interviste", source: "interview" },
  { label: "Interventi", source: "participation" },
  { label: "Comunicati stampa", source: "press_release" },
];
const PER_CATEGORY = 10;

let TYPES;
async function loadTypes() {
  TYPES = Object.fromEntries(
    (await to.itemTypes.list()).map((i) => [i.api_key, i]),
  );
}

async function ensureTaxonomyModel(apiKey, name) {
  if (TYPES[apiKey]) return TYPES[apiKey];
  console.log(
    `  modello "${apiKey}" ASSENTE -> ${COMMIT ? "creo" : "[dry] creerei"} "${name}"`,
  );
  if (!COMMIT) return null;
  const model = await to.itemTypes.create({
    name,
    api_key: apiKey,
    collection_appearance: "table",
  });
  const label = await to.fields.create(model.id, {
    label: "Label",
    api_key: "label",
    field_type: "string",
    localized: true,
    validators: { required: {} },
    appearance: {
      editor: "single_line",
      parameters: { heading: false, placeholder: null },
      addons: [],
    },
  });
  await to.itemTypes.update(model.id, {
    title_field: { type: "field", id: label.id },
  });
  TYPES[apiKey] = model;
  console.log(`  + modello "${apiKey}" + campo label`);
  return model;
}

async function listAll(modelId) {
  const rows = [];
  for await (const r of to.items.listPagedIterator({
    filter: { type: modelId },
    version: "current",
    perPage: 100,
  }))
    rows.push(r);
  return rows;
}

// upsert valore tassonomia per label (normalizzata). Ritorna id.
async function ensureValue(model, labelIt, labelEn, cacheByNorm) {
  const key = norm(labelIt);
  if (cacheByNorm.has(key)) return cacheByNorm.get(key);
  if (!COMMIT || !model) {
    cacheByNorm.set(key, "DRY");
    return "DRY";
  }
  const rec = await to.items.create({
    item_type: { type: "item_type", id: model.id },
    label: { it: labelIt, en: labelEn || labelIt },
  });
  await tryPublish(rec.id);
  cacheByNorm.set(key, rec.id);
  return rec.id;
}

async function ensureLinksField(
  modelApiKey,
  fieldApiKey,
  targetModelId,
  label,
) {
  const model = TYPES[modelApiKey];
  const existing = await to.fields.list(model.id);
  if (existing.some((f) => f.api_key === fieldApiKey)) {
    console.log(`  ${modelApiKey}.${fieldApiKey} ok`);
    return;
  }
  if (!COMMIT || !targetModelId) {
    console.log(`  [dry] ${modelApiKey}.${fieldApiKey} da creare`);
    return;
  }
  await to.fields.create(model.id, {
    label,
    api_key: fieldApiKey,
    field_type: "links",
    localized: false,
    validators: {
      items_item_type: {
        item_types: [targetModelId],
        on_publish_with_unpublished_references_strategy: "fail",
        on_reference_unpublish_strategy: "delete_references",
        on_reference_delete_strategy: "delete_references",
      },
    },
    appearance: {
      editor: "links_select",
      parameters: { filters: [] },
      addons: [],
    },
  });
  console.log(`  + ${modelApiKey}.${fieldApiKey} (links)`);
}

// ---- main ------------------------------------------------------------------
async function main() {
  console.log(`Ontologia -> ${ENV}  [${COMMIT ? "COMMIT" : "DRY-RUN"}]`);
  await loadTypes();

  // ===== FASE A: vocabolario =====
  console.log("\n[A1] tassonomia owner");
  const ownerModel = await ensureTaxonomyModel("owner", "Owner (figura)");
  const ownerCache = new Map();
  if (COMMIT && ownerModel)
    for (const r of await listAll(ownerModel.id))
      ownerCache.set(norm(val(r.label, "it")), r.id);
  const ownerValueId = {}; // label -> id
  for (const lbl of [
    "Ministro",
    "Sottosegretario",
    "Dipartimento",
    "Italia 2026",
  ]) {
    ownerValueId[lbl] = await ensureValue(ownerModel, lbl, lbl, ownerCache);
  }
  const srcOwnerToId = {}; // source figure page id -> owner value id
  for (const [pid, lbl] of Object.entries(OWNER_LABEL))
    srcOwnerToId[pid] = ownerValueId[lbl];

  console.log("\n[A2] tassonomia target");
  const targetModel = await ensureTaxonomyModel("target", "Target");
  const targetCache = new Map();
  if (COMMIT && targetModel)
    for (const r of await listAll(targetModel.id))
      targetCache.set(norm(val(r.label, "it")), r.id);
  const srcTargets = await from.items.list({
    filter: { type: "target" },
    page: { limit: 100 },
  });
  const srcTargetToId = {};
  for (const t of srcTargets) {
    const name = val(t.name, "it") || val(t.title, "it");
    srcTargetToId[t.id] = await ensureValue(
      targetModel,
      name,
      name,
      targetCache,
    );
  }
  console.log(
    `  target sorgente: ${srcTargets.map((t) => val(t.name, "it")).join(", ")}`,
  );

  console.log("\n[A3] estensione story_topic con i tag (Argomento)");
  const topicModel = TYPES["story_topic"];
  const topicCache = new Map();
  for (const r of await listAll(topicModel.id))
    topicCache.set(norm(val(r.label, "it")), r.id);
  const existingCount = topicCache.size;
  const srcTags = [];
  for await (const t of from.items.listPagedIterator({
    filter: { type: "tag" },
    perPage: 100,
  }))
    srcTags.push(t);
  const srcTagToId = {};
  let matched = 0,
    added = 0;
  for (const tag of srcTags) {
    const name = (val(tag.name, "it") || val(tag.title, "it")).trim();
    if (!name) continue;
    const aliased = TOPIC_ALIAS[norm(name)] || name;
    if (topicCache.has(norm(aliased))) {
      srcTagToId[tag.id] = topicCache.get(norm(aliased));
      matched++;
    } else {
      srcTagToId[tag.id] = await ensureValue(
        topicModel,
        name,
        name,
        topicCache,
      );
      if (COMMIT) added++;
    }
  }
  console.log(
    `  story_topic esistenti: ${existingCount} | tag sorgente: ${srcTags.length} | match: ${matched} | ${COMMIT ? "aggiunti" : "da aggiungere"}: ${COMMIT ? added : srcTags.length - matched}`,
  );

  // ===== FASE B: campi schema =====
  console.log("\n[B] campi schema (links)");
  await ensureLinksField("story_item", "owners", ownerModel?.id, "Owners");
  await ensureLinksField("story_item", "topics", topicModel.id, "Argomenti");
  await ensureLinksField("story_item", "targets", targetModel?.id, "Target");
  await ensureLinksField("focus_page", "topics", topicModel.id, "Argomenti");
  await ensureLinksField("focus_page", "targets", targetModel?.id, "Target");

  if (!COMMIT) {
    console.log("\n[C] (dry) ri-tagging saltato. Rilancia con --commit.");
    return;
  }

  // ===== FASE C: ri-tagging =====
  console.log("\n[C] ri-tagging contenuti");
  await loadTypes(); // ricarica per avere i nuovi campi
  const under = (
    await from.items.list({
      filter: { type: "undersecretary_page" },
      page: { limit: 1 },
    })
  )[0];

  const destBySlug = async (modelApiKey) => {
    const m = new Map();
    for await (const r of to.items.listPagedIterator({
      filter: { type: TYPES[modelApiKey].id },
      version: "current",
      perPage: 100,
    })) {
      const s = val(r.slug, "it");
      if (s) m.set(s, r);
    }
    return m;
  };
  const storyBySlug = await destBySlug("story_item");

  const mapIds = (arr, map) => [
    ...new Set((arr || []).map((id) => map[id]).filter(Boolean)),
  ];
  let tagged = 0;
  for (const cat of CATEGORIES) {
    const srcs = await from.items.list({
      filter: { type: cat.source, fields: { owners: { any_in: [under.id] } } },
      order_by: "date_shown_DESC",
      page: { limit: PER_CATEGORY },
    });
    for (const src of srcs) {
      const dest = storyBySlug.get(val(src.slug, "it"));
      if (!dest) continue;
      await to.items.update(dest.id, {
        owners: mapIds(src.owners, srcOwnerToId),
        topics: mapIds(src.tags, srcTagToId),
        targets: mapIds(src.targets, srcTargetToId),
      });
      await to.items.publish(dest.id);
      tagged++;
    }
  }
  console.log(`  story_item ri-taggati: ${tagged}`);

  // focus_page: match per slug col sorgente
  const focusDest = await destBySlug("focus_page");
  const srcFocusBySlug = new Map();
  for await (const f of from.items.listPagedIterator({
    filter: { type: "focus_page" },
    perPage: 100,
  })) {
    const s = val(f.slug, "it");
    if (s) srcFocusBySlug.set(s, f);
  }
  let focusTagged = 0;
  for (const [slug, dest] of focusDest) {
    const src = srcFocusBySlug.get(slug);
    if (!src) continue;
    await to.items.update(dest.id, {
      topics: mapIds(src.tags, srcTagToId),
      targets: mapIds(src.targets, srcTargetToId),
    });
    await to.items.publish(dest.id);
    focusTagged++;
  }
  console.log(`  focus_page ri-taggati: ${focusTagged}`);
  console.log("\n==== FINE COMMIT ====");
}

main().catch((e) => {
  console.error("ERRORE:", e?.message || e);
  if (e?.errors) console.error(JSON.stringify(e.errors, null, 2));
  process.exit(1);
});
