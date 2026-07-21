/**
 * Import "leggero" della sezione Sottosegretario da DATOCMS_FROM_IMPORT
 * verso l'ambiente `website-astro-2026` del progetto del sito.
 *
 * Segue il pattern gia' presente sull'ambiente (modelli "(import)" flat come
 * `press_release` / `focus_page`): un modello dedicato per categoria con soli
 * campi da card (title, subtitle, slug, summary, date_shown, seo), record
 * pubblicati. In questa fase: i 10 piu' recenti per categoria, it (+ en dove
 * presente nel sorgente).
 *
 * Uso:
 *   node scripts/import-undersecretary.mjs           # dry-run (nessuna scrittura)
 *   node scripts/import-undersecretary.mjs --commit   # esegue le scritture
 *
 * Idempotente: i modelli/campi vengono creati solo se assenti; i record sono
 * upsertati per slug (locale it). Rilanciabile senza creare duplicati.
 */
import { buildClient } from "@datocms/cma-client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const COMMIT = process.argv.includes("--commit");
const TARGET_ENV = "website-astro-2026";
const PER_CATEGORY = 10;

// Categorie: modello destinazione "(import)" <- tipo sorgente.
// `article` collide con il modello core "Articoli interni con sidebar",
// quindi per le Notizie usiamo l'api_key `news`.
const CATEGORIES = [
  { name: "Notizie (import)", apiKey: "news", source: "article" },
  { name: "Interviste (import)", apiKey: "interview", source: "interview" },
  { name: "Interventi (import)", apiKey: "participation", source: "participation" },
];

// Definizione campi: mirroring esatto di press_release ("Comunicati (import)").
const FIELD_DEFS = [
  { label: "Title", api_key: "title", field_type: "string", localized: true, validators: {}, appearance: { editor: "single_line", parameters: { heading: false, placeholder: null }, addons: [] } },
  { label: "Subtitle", api_key: "subtitle", field_type: "string", localized: true, validators: {}, appearance: { editor: "single_line", parameters: { heading: false, placeholder: null }, addons: [] } },
  { label: "Slug", api_key: "slug", field_type: "string", localized: true, validators: {}, appearance: { editor: "single_line", parameters: { heading: false, placeholder: null }, addons: [] } },
  { label: "Summary", api_key: "summary", field_type: "text", localized: true, validators: {}, appearance: { editor: "markdown", parameters: { toolbar: ["heading", "bold", "italic", "strikethrough", "code", "unordered_list", "ordered_list", "quote", "link", "image", "fullscreen"] }, addons: [] } },
  { label: "Date shown", api_key: "date_shown", field_type: "date_time", localized: false, validators: {}, appearance: { editor: "date_time_picker", parameters: {}, addons: [] } },
  { label: "SEO", api_key: "seo", field_type: "seo", localized: true, validators: {}, appearance: { editor: "seo", parameters: { fields: ["title", "description", "image", "no_index", "twitter_card"], previews: ["google", "twitter", "facebook", "telegram", "whatsapp", "slack", "linkedin"] }, addons: [] } },
];

const LOCALES = ["it", "en"];

const from = buildClient({ apiToken: process.env.DATOCMS_FROM_IMPORT, requestTimeout: 60000 });
const to = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: TARGET_ENV,
  requestTimeout: 60000,
});

// ---- helpers ---------------------------------------------------------------
const val = (field, locale) => {
  if (field == null) return "";
  if (typeof field === "object") return field[locale] ?? "";
  return locale === "it" ? field : "";
};
const nonEmpty = (s) => typeof s === "string" && s.trim().length > 0;

/** Costruisce il payload localizzato { it, en } per un campo stringa/testo. */
function localizedString(sourceField) {
  const out = {};
  for (const loc of LOCALES) out[loc] = val(sourceField, loc) || "";
  return out;
}

/** Costruisce il campo seo per locale, derivandolo da title/subtitle (no asset cross-progetto). */
function buildSeo(titleField, subtitleField) {
  const out = {};
  for (const loc of LOCALES) {
    const t = val(titleField, loc);
    out[loc] = nonEmpty(t)
      ? { title: t, description: val(subtitleField, loc) || null, image: null, no_index: false, twitter_card: null }
      : null;
  }
  return out;
}

// ---- schema (modelli + campi) ---------------------------------------------
async function ensureModel(cat) {
  const existing = (await to.itemTypes.list()).find((i) => i.api_key === cat.apiKey);
  if (existing) {
    console.log(`  modello "${cat.apiKey}" gia' presente (id ${existing.id})`);
    if (!COMMIT) return existing;
    await ensureFields(existing);
    return existing;
  }
  console.log(`  modello "${cat.apiKey}" ASSENTE -> ${COMMIT ? "creazione" : "[dry] verrebbe creato"} come "${cat.name}"`);
  if (!COMMIT) return null;
  const created = await to.itemTypes.create({
    name: cat.name,
    api_key: cat.apiKey,
    collection_appearance: "table",
    draft_mode_active: true,
    sortable: false,
    tree: false,
    singleton: false,
    all_locales_required: false,
  });
  await ensureFields(created);
  return created;
}

async function ensureFields(model) {
  const existing = await to.fields.list(model.id);
  const present = new Set(existing.map((f) => f.api_key));
  let titleFieldId = existing.find((f) => f.api_key === "title")?.id;
  for (const def of FIELD_DEFS) {
    if (present.has(def.api_key)) continue;
    const f = await to.fields.create(model.id, def);
    if (def.api_key === "title") titleFieldId = f.id;
    console.log(`    + campo ${def.api_key}`);
  }
  // Titolo di presentazione = campo title (best-effort, cosmetico)
  if (titleFieldId) {
    try {
      await to.itemTypes.update(model.id, { title_field: { type: "field", id: titleFieldId } });
    } catch { /* non bloccante */ }
  }
}

// ---- record ----------------------------------------------------------------
async function fetchSource(sourceType, undersecretaryId) {
  return from.items.list({
    filter: { type: sourceType, fields: { owners: { any_in: [undersecretaryId] } } },
    order_by: "date_shown_DESC",
    page: { limit: PER_CATEGORY },
    nested: false,
  });
}

async function existingBySlug(modelId) {
  const map = new Map();
  for await (const r of to.items.listPagedIterator({ filter: { type: modelId }, perPage: 100 })) {
    const slugIt = val(r.slug, "it");
    if (slugIt) map.set(slugIt, r);
  }
  return map;
}

function buildPayload(model, src) {
  return {
    item_type: { type: "item_type", id: model.id },
    title: localizedString(src.title),
    subtitle: localizedString(src.subtitle),
    slug: localizedString(src.slug),
    summary: localizedString(src.summary),
    date_shown: src.date_shown || null,
    seo: buildSeo(src.title, src.subtitle),
  };
}

async function importCategory(cat, undersecretaryId) {
  console.log(`\n=== ${cat.name} (sorgente: ${cat.source}) ===`);
  const model = await ensureModel(cat);
  const sources = await fetchSource(cat.source, undersecretaryId);
  console.log(`  sorgente: ${sources.length} record (top ${PER_CATEGORY} per date_shown desc)`);

  if (!COMMIT || !model) {
    sources.forEach((s, i) =>
      console.log(`   [dry] ${String(i + 1).padStart(2)}. ${val(s.slug, "it")}  (${(s.date_shown || "").slice(0, 10)})`),
    );
    return { created: 0, updated: 0, published: 0 };
  }

  const bySlug = await existingBySlug(model.id);
  let created = 0, updated = 0, published = 0;
  for (const src of sources) {
    const slugIt = val(src.slug, "it");
    const payload = buildPayload(model, src);
    let rec;
    if (bySlug.has(slugIt)) {
      const cur = bySlug.get(slugIt);
      rec = await to.items.update(cur.id, payload);
      updated++;
      process.stdout.write(`   ~ ${slugIt}\n`);
    } else {
      rec = await to.items.create(payload);
      created++;
      process.stdout.write(`   + ${slugIt}\n`);
    }
    await to.items.publish(rec.id);
    published++;
  }
  return { created, updated, published };
}

// ---- main ------------------------------------------------------------------
async function main() {
  console.log(`Import Sottosegretario -> env ${TARGET_ENV}  [${COMMIT ? "COMMIT" : "DRY-RUN"}]`);
  const site = await to.site.find();
  console.log(`Progetto destinazione: ${site.name}`);

  const under = (await from.items.list({ filter: { type: "undersecretary_page" }, page: { limit: 1 } }))[0];
  console.log(`Sottosegretario sorgente: ${val(under.title, "it")} (id ${under.id})`);

  const totals = { created: 0, updated: 0, published: 0 };
  for (const cat of CATEGORIES) {
    const r = await importCategory(cat, under.id);
    totals.created += r.created;
    totals.updated += r.updated;
    totals.published += r.published;
  }

  console.log(`\n==== RIEPILOGO [${COMMIT ? "COMMIT" : "DRY-RUN"}] ====`);
  console.log(`  creati: ${totals.created} | aggiornati: ${totals.updated} | pubblicati: ${totals.published}`);
  if (!COMMIT) console.log(`  (nessuna scrittura effettuata; rilancia con --commit per applicare)`);
}

main().catch((e) => {
  console.error("ERRORE:", e?.message || e);
  if (e?.errors) console.error(JSON.stringify(e.errors, null, 2));
  process.exit(1);
});
