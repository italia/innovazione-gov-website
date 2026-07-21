/**
 * Fase 2 — Costruzione pagine Sottosegretario su `website-astro-2026`:
 *  - promuove lo staging in `story_item` (i 10 piu' recenti per categoria dal
 *    progetto sorgente), con story_class + topic + date_of_publication;
 *  - crea il profilo `page`, i 4 archivi `index_page` (catalogue_feed) e la
 *    pagina `Deleghe` (testo dalle subpage sorgente Biografia/Deleghe/Contatti);
 *  - collega preview (news_feed/story_tab) e CTA (internal_link -> index_page);
 *  - pubblica tutto.
 *
 * Uso:
 *   node scripts/build-undersecretary-pages.mjs            # dry-run
 *   node scripts/build-undersecretary-pages.mjs --commit   # esegue
 *
 * Idempotente: story_class/topic per label, pagine/index_page per slug,
 * story_item per slug. Rilanciabile senza duplicati.
 */
import { buildClient, buildBlockRecord } from "@datocms/cma-client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const COMMIT = process.argv.includes("--commit");
const ENV = "website-astro-2026";
const PER_CATEGORY = 10;
const PREVIEW_COUNT = 3;
const LOCALES = ["it", "en"];

// Categoria -> sorgente + story_class + slug archivio
const CATEGORIES = [
  { key: "notizie", label: "Notizie", source: "article", slug: "notizie", ctaAll: "Vedi tutte le notizie" },
  { key: "interviste", label: "Interviste", source: "interview", slug: "interviste", ctaAll: "Vedi tutte le interviste" },
  { key: "interventi", label: "Interventi", source: "participation", slug: "interventi", ctaAll: "Vedi tutti gli interventi" },
  { key: "comunicati", label: "Comunicati stampa", source: "press_release", slug: "comunicati-stampa", ctaAll: "Vedi tutti i comunicati" },
];

const from = buildClient({ apiToken: process.env.DATOCMS_FROM_IMPORT, requestTimeout: 60000 });
const to = buildClient({ apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN, environment: ENV, requestTimeout: 60000 });

// ---- helpers ---------------------------------------------------------------
const val = (f, l) => (f == null ? "" : typeof f === "object" ? (f[l] ?? "") : l === "it" ? f : "");
const loc = (f) => { const o = {}; for (const l of LOCALES) o[l] = val(f, l) || ""; return o; };
// Come loc(), ma riempie i locali vuoti con l'italiano (per campi REQUIRED
// per-locale come title/slug su page/index_page/story_item).
const locReq = (f) => { const it = val(f, "it") || ""; const o = {}; for (const l of LOCALES) o[l] = val(f, l) || it; return o; };
const tryPublish = async (id) => { try { await to.items.publish(id); } catch { /* modello senza draft mode */ } };
// Valore per un campo link SINGOLO localizzato: id string per ogni locale (o null).
const lnkLoc = (id) => ({ it: id || null, en: id || null });
const nonEmpty = (s) => typeof s === "string" && s.trim().length > 0;
const blocksOf = (v) => (!v ? [] : Array.isArray(v) ? v : typeof v === "object" ? Object.values(v).flatMap((x) => (Array.isArray(x) ? x : [])) : []);

let TYPES; // api_key -> item_type id
async function loadTypes() {
  const its = await to.itemTypes.list();
  TYPES = Object.fromEntries(its.map((i) => [i.api_key, i.id]));
  const need = ["page", "index_page", "story_item", "story_class", "story_topic", "hero", "text_image", "text_block", "text_only", "news_feed", "story_tab", "support_cta_section", "internal_link", "catalogue_tab", "catalogue_feed"];
  const missing = need.filter((k) => !TYPES[k]);
  if (missing.length) throw new Error("Modelli/blocchi mancanti su " + ENV + ": " + missing.join(", "));
}
const T = (k) => ({ type: "item_type", id: TYPES[k] });

// NB: version:"current" per includere i draft (la list di default mostra solo
// i record con una versione pubblicata) -> idempotenza anche su run parziali.
async function firstBySlug(apiKey, slugIt) {
  for await (const r of to.items.listPagedIterator({ filter: { type: TYPES[apiKey] }, version: "current", perPage: 100 })) {
    if (val(r.slug, "it") === slugIt) return r;
  }
  return null;
}

// ---- taxonomies ------------------------------------------------------------
const storyClassId = {}; // category.key -> id
async function ensureStoryClasses() {
  const existing = [];
  for await (const r of to.items.listPagedIterator({ filter: { type: TYPES.story_class }, version: "current", perPage: 100 })) existing.push(r);
  let sort = existing.length;
  for (const cat of CATEGORIES) {
    const found = existing.find((r) => val(r.label, "it") === cat.label);
    if (found) { storyClassId[cat.key] = found.id; await tryPublish(found.id); console.log(`  story_class "${cat.label}" ok`); continue; }
    if (!COMMIT) { console.log(`  [dry] story_class "${cat.label}" da creare`); continue; }
    const created = await to.items.create({ item_type: T("story_class"), label: { it: cat.label, en: cat.label }, sort: String(sort++) });
    await tryPublish(created.id);
    storyClassId[cat.key] = created.id;
    console.log(`  + story_class "${cat.label}"`);
  }
}

const topicCache = new Map(); // label(it) -> id
async function ensureTopic(labelIt, labelEn) {
  if (!nonEmpty(labelIt)) return null;
  if (topicCache.has(labelIt)) return topicCache.get(labelIt);
  const found = await firstByLabel("story_topic", labelIt);
  if (found) { topicCache.set(labelIt, found.id); return found.id; }
  if (!COMMIT) { topicCache.set(labelIt, "DRY"); return "DRY"; }
  const created = await to.items.create({ item_type: T("story_topic"), label: { it: labelIt, en: labelEn || labelIt } });
  await tryPublish(created.id);
  topicCache.set(labelIt, created.id);
  return created.id;
}
async function firstByLabel(apiKey, labelIt) {
  for await (const r of to.items.listPagedIterator({ filter: { type: TYPES[apiKey] }, version: "current", perPage: 100 })) {
    if (val(r.label, "it") === labelIt) return r;
  }
  return null;
}

// primo tag (argomento) del record sorgente -> {it,en} label
async function primaryTopicLabels(src) {
  const tagId = Array.isArray(src.tags) ? src.tags[0] : null;
  if (!tagId) return null;
  try {
    const tag = await from.items.find(tagId);
    const it = val(tag.label ?? tag.title ?? tag.name, "it");
    const en = val(tag.label ?? tag.title ?? tag.name, "en");
    return nonEmpty(it) ? { it, en } : null;
  } catch { return null; }
}

// ---- source fetch ----------------------------------------------------------
async function sourceTop(cat, underId) {
  return from.items.list({
    filter: { type: cat.source, fields: { owners: { any_in: [underId] } } },
    order_by: "date_shown_DESC", page: { limit: PER_CATEGORY }, nested: false,
  });
}

// ---- story_item promotion --------------------------------------------------
const storyIdsByCat = {}; // key -> [ids] (in source order)
async function promoteStories(cat, underId) {
  const srcs = await sourceTop(cat, underId);
  console.log(`  ${cat.label}: ${srcs.length} sorgente`);
  storyIdsByCat[cat.key] = [];
  if (!COMMIT) { srcs.forEach((s) => console.log(`   [dry] story_item <- ${val(s.slug, "it")}`)); return; }
  for (const s of srcs) {
    const slugIt = val(s.slug, "it");
    const topicLabels = await primaryTopicLabels(s);
    const topicId = topicLabels ? await ensureTopic(topicLabels.it, topicLabels.en) : null;
    const dateOnly = (s.date_shown || "").slice(0, 10) || null;
    const payload = {
      item_type: T("story_item"),
      title: locReq(s.title),
      slug: locReq(s.slug),
      paragraph: loc(nonEmpty(val(s.subtitle, "it")) ? s.subtitle : s.summary),
      story_type: "news",
      date_of_publication: dateOnly ? { it: dateOnly, en: dateOnly } : { it: null, en: null },
      article_classification: lnkLoc(storyClassId[cat.key]),
      topic: lnkLoc(topicId && topicId !== "DRY" ? topicId : null),
      parent_page: lnkLoc(indexPageId[cat.key]),
      content: { it: [], en: [] },
    };
    const existing = await firstBySlug("story_item", slugIt);
    let rec;
    if (existing) { rec = await to.items.update(existing.id, payload); process.stdout.write(`   ~ story_item ${slugIt}\n`); }
    else { rec = await to.items.create(payload); process.stdout.write(`   + story_item ${slugIt}\n`); }
    await to.items.publish(rec.id);
    storyIdsByCat[cat.key].push(rec.id);
  }
}

// ---- pages -----------------------------------------------------------------
let profileId;
const indexPageId = {}; // key -> id

async function ensureProfileShell(under) {
  const existing = await firstBySlug("page", "sottosegretario");
  // Il profilo va pubblicato PRIMA degli index_page (che lo referenziano via
  // parent_page): un link a un record non pubblicato blocca la publish.
  if (existing) { profileId = existing.id; await tryPublish(existing.id); console.log(`  profilo page "sottosegretario" ok (${profileId})`); return; }
  if (!COMMIT) { console.log(`  [dry] profilo page "sottosegretario" da creare`); return; }
  const created = await to.items.create({
    item_type: T("page"),
    title: locReq(under.title),
    slug: { it: "sottosegretario", en: "undersecretary" },
    content: { it: [], en: [] },
  });
  await tryPublish(created.id);
  profileId = created.id;
  console.log(`  + profilo page "sottosegretario" (pubblicato)`);
}

async function ensureIndexPage(cat) {
  const existing = await firstBySlug("index_page", cat.slug);
  if (existing) { indexPageId[cat.key] = existing.id; await tryPublish(existing.id); console.log(`  index_page "${cat.slug}" ok`); return; }
  if (!COMMIT) { console.log(`  [dry] index_page "${cat.slug}" da creare`); return; }
  const heroBlock = buildBlockRecord({ item_type: T("hero"), variant: "small", show_breadcrumb: true, title: cat.label, paragraph: "", cta: null });
  const tab = buildBlockRecord({
    item_type: T("catalogue_tab"),
    title: `Tutti i contenuti: ${cat.label.toLowerCase()}`,
    paragraph: `Esplora l'archivio completo dei contenuti del Sottosegretario nella sezione ${cat.label.toLowerCase()}.`,
    filter_style: JSON.stringify(["pills"]), filter_title: "Filtra per argomento",
    label_for_all: "Tutti", news_page_tab_type: "story_item", story_type: "news",
    filter_story: storyClassId[cat.key] || null,
    element_per_page: PER_CATEGORY,
  });
  const feed = buildBlockRecord({ item_type: T("catalogue_feed"), background_color: "default", tabs: [tab] });
  const created = await to.items.create({
    item_type: T("index_page"),
    title: { it: cat.label, en: cat.label },
    slug: { it: cat.slug, en: cat.slug },
    parent_page: lnkLoc(profileId),
    content: { it: [heroBlock, feed], en: [heroBlock, feed] },
  });
  await to.items.publish(created.id);
  indexPageId[cat.key] = created.id;
  console.log(`  + index_page "${cat.slug}" (pubblicato)`);
}

// blocco testo (text_block) da body markdown. title/paragraph sono REQUIRED.
function textBlock(title, markdown) {
  return buildBlockRecord({
    item_type: T("text_block"),
    title: nonEmpty(title) ? title : "Approfondimento",
    paragraph: nonEmpty(markdown) ? markdown : "—",
    cta: null,
  });
}

async function updateProfileContent(under, subpages) {
  if (!COMMIT || !profileId) { console.log(`  [dry] contenuto profilo (hero+bio+${CATEGORIES.length} preview+cta)`); return; }
  const content = { it: [], en: [] };
  for (const l of LOCALES) {
    const arr = [];
    // Hero
    arr.push(buildBlockRecord({ item_type: T("hero"), variant: "default", show_breadcrumb: false, title: val(under.title, l) || val(under.title, "it"), paragraph: val(under.subtitle, l) || val(under.subtitle, "it"), cta: null }));
    // Biografia (text_image, senza immagine in fase 1)
    const bio = subpages.biografia?.[l] || subpages.biografia?.it || "";
    arr.push(buildBlockRecord({ item_type: T("text_image"), variant: "default", heading: "h2", text: textBlock("Biografia", bio), image: null, additional_content: null }));
    // Preview per categoria
    for (const cat of CATEGORIES) {
      const ids = (storyIdsByCat[cat.key] || []).slice(0, PREVIEW_COUNT);
      const storyTab = buildBlockRecord({ item_type: T("story_tab"), title: cat.label, news: ids });
      const cta = indexPageId[cat.key]
        ? buildBlockRecord({ item_type: T("internal_link"), label: cat.ctaAll, link_to: indexPageId[cat.key] })
        : null;
      arr.push(buildBlockRecord({ item_type: T("news_feed"), background_color: "default", title: cat.label, paragraph: `Gli ultimi contenuti del Sottosegretario: ${cat.label.toLowerCase()}.`, tabs: [storyTab], cta }));
    }
    // Contatti: support_cta_section richiede un'immagine (assente in fase 1),
    // quindi uso un text_only con il testo dei contatti.
    const contatti = subpages.contatti?.[l] || subpages.contatti?.it || "";
    if (nonEmpty(contatti)) {
      arr.push(buildBlockRecord({ item_type: T("text_only"), background_color: "default", heading: "h2", text: textBlock("Contatti", contatti) }));
    }
    content[l] = arr;
  }
  await to.items.update(profileId, { content });
  await to.items.publish(profileId);
  console.log(`  ~ contenuto profilo aggiornato + pubblicato`);
}

async function ensureDeleghe(subpages) {
  const existing = await firstBySlug("page", "deleghe");
  if (!COMMIT) { console.log(`  [dry] page "deleghe" ${existing ? "(update)" : "(create)"}`); return; }
  const content = { it: [], en: [] };
  for (const l of LOCALES) {
    const sections = subpages.delegheSections?.[l] || subpages.delegheSections?.it || [];
    content[l] = sections.length
      ? sections.map((sec, i) => buildBlockRecord({ item_type: T("text_only"), background_color: "default", heading: "h2", text: textBlock(sec.title || `Deleghe — parte ${i + 1}`, sec.body) }))
      : [buildBlockRecord({ item_type: T("text_only"), background_color: "default", heading: "h2", text: textBlock("Deleghe", "Contenuto in aggiornamento.") })];
  }
  let id;
  if (existing) {
    await to.items.update(existing.id, { content });
    id = existing.id;
    console.log(`  ~ page "deleghe" aggiornata`);
  } else {
    const created = await to.items.create({ item_type: T("page"), title: { it: "Deleghe", en: "Delegations" }, slug: { it: "deleghe", en: "delegations" }, content });
    id = created.id;
    console.log(`  + page "deleghe" creata`);
  }
  // parent ad albero (page usa parent_id, non un campo parent_page)
  try { await to.items.update(id, { parent_id: profileId }); console.log(`    parent -> profilo`); }
  catch (e) { console.log(`    (parent albero non impostato: ${String(e.message).slice(0, 50)}; resta a root)`); }
  await tryPublish(id);
}

// ---- subpage text extraction (FROM) ----------------------------------------
async function loadSubpages() {
  const out = { biografia: {}, contatti: {}, delegheSections: {} };
  const BODY = "block_body_text";
  const its = await from.itemTypes.list();
  const bodyId = its.find((i) => i.api_key === BODY)?.id;
  for await (const s of from.items.listPagedIterator({ filter: { type: "undersecretary_subpage" }, nested: true, perPage: 50 })) {
    const slug = val(s.slug, "it");
    for (const l of LOCALES) {
      const arr = blocksOf(s.content_blocks?.[l] ?? (l === "it" ? s.content_blocks : null));
      const texts = arr.filter((b) => b.relationships?.item_type?.data?.id === bodyId)
        .map((b) => ({ title: b.attributes?.text_title || "", body: b.attributes?.body_text || "" }));
      if (slug === "biografia") out.biografia[l] = texts.map((t) => t.body).filter(Boolean).join("\n\n");
      if (slug === "contatti") out.contatti[l] = texts.map((t) => t.body).filter(Boolean).join("\n\n");
      if (slug === "deleghe") out.delegheSections[l] = texts;
    }
  }
  return out;
}

// ---- main ------------------------------------------------------------------
async function main() {
  console.log(`Build pagine Sottosegretario -> ${ENV}  [${COMMIT ? "COMMIT" : "DRY-RUN"}]`);
  await loadTypes();
  const under = (await from.items.list({ filter: { type: "undersecretary_page" }, page: { limit: 1 } }))[0];
  console.log(`Sottosegretario: ${val(under.title, "it")}`);

  console.log("\n[1] story_class");
  await ensureStoryClasses();

  console.log("\n[2] profilo (shell)");
  await ensureProfileShell(under);

  console.log("\n[3] index_page archivi");
  for (const cat of CATEGORIES) await ensureIndexPage(cat);

  console.log("\n[4] promozione story_item (10/cat)");
  for (const cat of CATEGORIES) await promoteStories(cat, under.id);

  console.log("\n[5] subpage testi (bio/deleghe/contatti)");
  const subpages = await loadSubpages();
  console.log(`  bio it:${subpages.biografia.it ? "Y" : "-"} | deleghe sez it:${(subpages.delegheSections.it || []).length} | contatti it:${subpages.contatti.it ? "Y" : "-"}`);

  console.log("\n[6] contenuto profilo (hero+bio+preview+cta)");
  await updateProfileContent(under, subpages);

  console.log("\n[7] pagina Deleghe");
  await ensureDeleghe(subpages);

  console.log(`\n==== FINE [${COMMIT ? "COMMIT" : "DRY-RUN"}] ====`);
  if (!COMMIT) console.log("  nessuna scrittura; rilancia con --commit");
}

main().catch((e) => { console.error("ERRORE:", e?.message || e); if (e?.errors) console.error(JSON.stringify(e.errors, null, 2)); process.exit(1); });
