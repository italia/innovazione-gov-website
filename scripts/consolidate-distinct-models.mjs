/**
 * Consolida i tipi in modelli DISTINTI con la struttura di story_item.
 * Notizie restano su story_item; Interviste/Interventi/Comunicati/Focus vanno
 * sui modelli dedicati interview/participation/press_release/focus_page.
 *
 * Fase 1 (data):
 *  - espande i modelli distinti clonando i campi content+ontologia di story_item
 *  - rinomina togliendo " (import)"
 *  - popola i record dei modelli distinti dai gemelli story_item (per slug)
 *  - cancella gli story_item di Interviste/Interventi/Comunicati (resta Notizie)
 *
 * Uso: node scripts/consolidate-distinct-models.mjs [--commit]
 * Idempotente.
 */
import { buildClient } from "@datocms/cma-client";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const COMMIT = process.argv.includes("--commit");
const ENV = "website-astro-2026";
const to = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: ENV,
  requestTimeout: 60000,
});
const val = (f, l) =>
  f == null ? "" : typeof f === "object" ? (f[l] ?? "") : l === "it" ? f : "";

// modello distinto <- story_class dei gemelli story_item
const MODELS = [
  { apiKey: "interview", storyClass: "Interviste", owners: true },
  { apiKey: "participation", storyClass: "Interventi", owners: true },
  { apiKey: "press_release", storyClass: "Comunicati stampa", owners: true },
  { apiKey: "focus_page", storyClass: null, owners: false }, // nessun gemello story_item
];
// campi di story_item da clonare (esclusi title/slug/seo già presenti e i
// discriminatori article_classification/story_type)
const CLONE_COMMON = [
  "parent_page",
  "paragraph",
  "date_of_publication",
  "image",
  "content",
  "topic",
  "topics",
  "targets",
];
const CLONE_OWNERS = ["owners"];

const its = await to.itemTypes.list();
const byKey = Object.fromEntries(its.map((i) => [i.api_key, i]));
const byId = Object.fromEntries(its.map((i) => [i.id, i.api_key]));

// def dei campi story_item
const siFields = await to.fields.list(byKey["story_item"].id);
const siByKey = Object.fromEntries(siFields.map((f) => [f.api_key, f]));

async function ensureFields(model, keys) {
  const existing = new Set(
    (await to.fields.list(model.id)).map((f) => f.api_key),
  );
  for (const k of keys) {
    if (existing.has(k)) continue;
    const src = siByKey[k];
    if (!src) {
      console.log(`   ! story_item non ha ${k}`);
      continue;
    }
    if (!COMMIT) {
      console.log(`   [dry] ${model.api_key}.${k} da creare`);
      continue;
    }
    await to.fields.create(model.id, {
      label: src.label,
      api_key: src.api_key,
      field_type: src.field_type,
      localized: src.localized,
      validators: src.validators,
      appearance: {
        editor: src.appearance.editor,
        parameters: src.appearance.parameters,
        addons: src.appearance.addons || [],
      },
    });
    console.log(`   + ${model.api_key}.${k}`);
  }
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

async function main() {
  console.log(
    `Consolidamento modelli distinti -> ${ENV}  [${COMMIT ? "COMMIT" : "DRY-RUN"}]`,
  );

  // gemelli story_item per slug (tutti)
  const siRows = await listAll(byKey["story_item"].id);
  const siBySlug = new Map(siRows.map((r) => [val(r.slug, "it"), r]));

  // [1] espansione schema + rename
  console.log("\n[1] espansione schema + rename");
  for (const m of MODELS) {
    const model = byKey[m.apiKey];
    if (!model) {
      console.log(`  ${m.apiKey}: ASSENTE`);
      continue;
    }
    console.log(`  ${m.apiKey}`);
    await ensureFields(
      model,
      m.owners ? [...CLONE_COMMON, ...CLONE_OWNERS] : CLONE_COMMON,
    );
    const cleanName = model.name.replace(/\s*\(import\)\s*$/i, "");
    if (COMMIT && cleanName !== model.name) {
      await to.itemTypes.update(model.id, { name: cleanName });
      console.log(`   rename "${model.name}" -> "${cleanName}"`);
    }
  }

  if (!COMMIT) {
    console.log(
      "\n[2-3] (dry) migrazione/cleanup saltati. Rilancia con --commit.",
    );
    return;
  }

  // ricarica tipi/campi (nuovi campi)
  const its2 = await to.itemTypes.list();
  const byKey2 = Object.fromEntries(its2.map((i) => [i.api_key, i]));

  // [2] migrazione contenuti. NB: i campi localizzati vengono impostati solo
  // sul locale `it` per evitare il vincolo INVALID_LOCALES (l'EN sorgente era
  // comunque quasi sempre vuoto); i campi non localizzati come sono.
  console.log("\n[2] migrazione contenuti dai gemelli story_item");
  const COPY = [
    "parent_page",
    "paragraph",
    "date_of_publication",
    "image",
    "content",
    "topic",
    "topics",
    "targets",
    "owners",
  ];
  const LOCALIZED = new Set([
    "parent_page",
    "paragraph",
    "date_of_publication",
    "content",
    "topic",
  ]);
  // locali attivi del record (dedotti dal titolo localizzato)
  const recLocales = (rec) =>
    rec.title && typeof rec.title === "object"
      ? Object.keys(rec.title)
      : ["it"];
  // costruisce il valore di un campo localizzato per i locali del record
  const toLocales = (v, locales) => {
    const out = {};
    const isLoc = v && typeof v === "object" && !Array.isArray(v);
    for (const loc of locales)
      out[loc] = isLoc ? (v[loc] ?? v.it ?? null) : (v ?? null);
    return out;
  };
  for (const m of MODELS) {
    if (!m.storyClass) continue; // focus gestito a parte
    const model = byKey2[m.apiKey];
    let n = 0;
    for (const rec of await listAll(model.id)) {
      const twin = siBySlug.get(val(rec.slug, "it"));
      if (!twin) continue;
      const locs = recLocales(rec);
      const payload = {};
      for (const k of COPY) {
        if (!(k in twin)) continue;
        payload[k] = LOCALIZED.has(k) ? toLocales(twin[k], locs) : twin[k];
      }
      await to.items.update(rec.id, payload);
      await to.items.publish(rec.id);
      n++;
    }
    console.log(`  ${m.apiKey}: ${n} record popolati dai gemelli`);
  }
  // focus: paragraph da subtitle/summary, date_of_publication da date_shown
  const focus = byKey2["focus_page"];
  let nf = 0;
  for (const rec of await listAll(focus.id)) {
    const locs = recLocales(rec);
    const payload = {};
    payload.paragraph = {};
    for (const loc of locs)
      payload.paragraph[loc] =
        val(rec.subtitle, loc) || val(rec.summary, loc) || "";
    if (rec.date_shown) {
      payload.date_of_publication = {};
      for (const loc of locs)
        payload.date_of_publication[loc] = String(rec.date_shown).slice(0, 10);
    }
    await to.items.update(rec.id, payload);
    await to.items.publish(rec.id);
    nf++;
  }
  console.log(
    `  focus_page: ${nf} record (paragraph/date da subtitle/date_shown)`,
  );

  // [3] cancellazione gemelli story_item (Interviste/Interventi/Comunicati).
  // DEFERITA: gli story_item sono ancora referenziati dalle preview del profilo
  // (news_feed/story_tab) e dagli archivi. Si cancellano solo DOPO il ri-cablaggio
  // frontend ai modelli distinti (Fase 2), lanciando con --delete-twins.
  if (process.argv.includes("--delete-twins")) {
    console.log("\n[3] cancellazione gemelli story_item migrati");
    const SC = byKey2["story_class"];
    const classId = {};
    for (const c of await listAll(SC.id)) classId[val(c.label, "it")] = c.id;
    const toDeleteClasses = new Set(
      MODELS.filter((m) => m.storyClass).map((m) => classId[m.storyClass]),
    );
    let del = 0;
    for (const r of siRows) {
      const cid = val(r.article_classification, "it");
      if (toDeleteClasses.has(cid)) {
        await to.items.destroy(r.id);
        del++;
      }
    }
    console.log(
      `  story_item cancellati: ${del} (restano Notizie + eventuali orfani)`,
    );
  } else {
    console.log(
      "\n[3] cancellazione gemelli DEFERITA (usa --delete-twins dopo il ri-cablaggio frontend)",
    );
  }
  console.log("\n==== FINE COMMIT ====");
}

main().catch((e) => {
  console.error("ERRORE:", e?.message || e);
  if (e?.errors) console.error(JSON.stringify(e.errors, null, 2));
  process.exit(1);
});
