import { buildBlockRecord, buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";
import { headingNode, markdownToDastNodes } from "./lib/markdown-to-dast.mjs";

dotenv.config({ path: ".env" });

const TARGET_ENV = "website-astro-2026";
const LOCALE = "it";
const NEWS_PAGE = "VEVDAxmpTEygLw8wJl7mcA";
const INDEX_SLUG = "avvisi-pubblici";
const INDEX_TITLE = "Avvisi pubblici";
const COMMIT = process.argv.includes("--commit");
const ONLY_MISSING = process.argv.includes("--only-missing");
const REFRESH = process.argv.includes("--refresh");
const limitIndex = process.argv.indexOf("--limit");
const LIMIT = limitIndex > -1 ? Number(process.argv[limitIndex + 1]) : Infinity;

const STATUS_BY_SOURCE_NAME = {
  APERTO: "open",
  CHIUSO: "closed",
  ESITI: "results",
  RITIRATO: "withdrawn",
  SCADUTO: "expired",
  SOSPESO: "suspended",
};

const CATEGORY_BY_SOURCE_SLUG = {
  avviso: "notice",
  bando: "call",
  concorso: "competition",
  "gara-d-appalto": "tender",
  "incarichi-esterni": "external_assignment",
  "manifestazione-d-interesse": "expression_of_interest",
};

const from = buildClient({
  apiToken: process.env.DATOCMS_FROM_IMPORT,
  requestTimeout: 120000,
});
const to = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: TARGET_ENV,
  requestTimeout: 120000,
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry(label, action) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      const recoverable =
        /ETIMEDOUT|ECONNRESET|socket hang up|502|503|504/i.test(
          String(error?.message ?? error),
        );
      if (!recoverable || attempt >= 4) throw error;
      console.log(`   ritento ${label} (${attempt})`);
      await wait(attempt * 3000);
    }
  }
}

const value = (field) =>
  field && typeof field === "object" && !Array.isArray(field)
    ? (field[LOCALE] ?? null)
    : (field ?? null);
const seoValue = (field) => {
  if (!field || typeof field !== "object") return {};
  if ("title" in field || "description" in field) return field;
  return field[LOCALE] ?? {};
};
const text = (input) => String(input ?? "").trim();
const normalize = (input) => text(input).toLowerCase().replace(/\s+/g, " ");
const clamp = (input, max) => {
  const full = text(input);
  if (full.length <= max) return full;
  const cut = full.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim();
};
const dateOnly = (input) => (text(input) ? text(input).slice(0, 10) : null);

const uploadIdBySourceId = new Map();
async function copyUpload(sourceUploadId) {
  if (uploadIdBySourceId.has(sourceUploadId))
    return uploadIdBySourceId.get(sourceUploadId);
  const source = await from.uploads.find(sourceUploadId);
  const created = await withRetry(`upload ${source.filename}`, () =>
    to.uploads.createFromUrl({
      url: source.url,
      filename: source.filename,
      skipCreationIfAlreadyExists: true,
    }),
  );
  uploadIdBySourceId.set(sourceUploadId, created.id);
  return created.id;
}

const sourceItemCache = new Map();
async function sourceItem(id) {
  if (!sourceItemCache.has(id))
    sourceItemCache.set(
      id,
      await from.items.find(id, { version: "current", nested: true }),
    );
  return sourceItemCache.get(id);
}

const sourceTypes = await from.itemTypes.list();
const targetTypes = await to.itemTypes.list();
const sourceTypeId = (apiKey) =>
  sourceTypes.find((type) => type.api_key === apiKey)?.id;
const targetTypeId = (apiKey) => {
  const type = targetTypes.find((entry) => entry.api_key === apiKey);
  if (!type) throw new Error(`modello ${apiKey} non presente in ${TARGET_ENV}`);
  return type.id;
};
const sourceBlockApiKey = Object.fromEntries(
  sourceTypes.map((type) => [type.id, type.api_key]),
);
const block = (apiKey, attributes) =>
  buildBlockRecord({
    item_type: { type: "item_type", id: targetTypeId(apiKey) },
    ...attributes,
  });

async function listSource(apiKey) {
  const records = [];
  for await (const record of from.items.listPagedIterator({
    filter: { type: sourceTypeId(apiKey) },
    version: "current",
    nested: true,
  }))
    records.push(record);
  return records;
}

async function listTarget(apiKey) {
  const records = [];
  for await (const record of to.items.listPagedIterator({
    filter: { type: targetTypeId(apiKey) },
    version: "current",
  }))
    records.push(record);
  return records;
}

const statusNameById = new Map(
  (await listSource("announcements_state")).map((record) => [
    record.id,
    text(value(record.title) ?? record.title ?? record.name).toUpperCase(),
  ]),
);
const categorySlugById = new Map(
  (await listSource("announcements_category")).map((record) => [
    record.id,
    text(value(record.slug) ?? record.slug),
  ]),
);

const droppedTags = new Set();
const droppedFields = new Set();
const droppedBlocks = new Set();
const droppedRelated = new Set();
const unpublishedRelated = new Set();

async function buildContent(announcement) {
  const nodes = [];
  const sourceBlocks = value(announcement.content_blocks) ?? [];
  for (const sourceBlock of Array.isArray(sourceBlocks) ? sourceBlocks : []) {
    const kind =
      sourceBlockApiKey[
        sourceBlock.relationships?.item_type?.data?.id ??
          sourceBlock.item_type?.id
      ];
    const attributes = sourceBlock.attributes ?? sourceBlock;
    if (kind !== "block_body_text") {
      droppedBlocks.add(kind ?? "sconosciuto");
      continue;
    }
    const heading = text(attributes.text_title);
    if (heading) nodes.push(headingNode(heading, 3));
    nodes.push(...markdownToDastNodes(attributes.body_text));
  }

  for (const attachmentId of announcement.attachments ?? []) {
    const attachment = await sourceItem(attachmentId);
    const uploadId = attachment.file?.upload_id;
    if (!uploadId) continue;
    nodes.push({
      type: "block",
      item: block("download_link", {
        label: text(attachment.file_title) || "Allegato",
        description: text(attachment.file_description),
        doc: { upload_id: await copyUpload(uploadId) },
      }),
    });
  }

  const externalLinks = [];
  for (const linkId of announcement.links ?? []) {
    const link = await sourceItem(linkId);
    if (!text(link.link)) continue;
    externalLinks.push(
      block("external_link", {
        label: text(link.title) || text(link.cta_label) || text(link.link),
        description: text(link.description),
        url: text(link.link),
      }),
    );
  }
  if (externalLinks.length)
    nodes.push({
      type: "block",
      item: block("list_external_link", { links: externalLinks }),
    });

  if (!nodes.length)
    nodes.push({
      type: "paragraph",
      children: [{ type: "span", value: "Da completare." }],
    });
  return nodes;
}

async function findOrCreateIndexPage() {
  const existing = (await listTarget("index_page")).find(
    (record) =>
      value(record.slug) === INDEX_SLUG &&
      value(record.parent_page) === NEWS_PAGE,
  );
  if (existing) {
    console.log(`pagina indice già presente: ${existing.id}`);
    return existing.id;
  }
  if (!COMMIT) {
    console.log(`[dry] da creare la pagina indice /novita/${INDEX_SLUG}`);
    return null;
  }
  const created = await to.items.create({
    item_type: { type: "item_type", id: targetTypeId("index_page") },
    title: { [LOCALE]: INDEX_TITLE },
    slug: { [LOCALE]: INDEX_SLUG },
    parent_page: { [LOCALE]: NEWS_PAGE },
    content: {
      [LOCALE]: [
        block("hero", {
          variant: "default",
          background_color: "default",
          background_image: null,
          background_image_for_mobile: null,
          show_breadcrumb: true,
          title: INDEX_TITLE,
          paragraph:
            "Avvisi, bandi, gare e manifestazioni di interesse del Dipartimento per la trasformazione digitale.",
          cta: null,
          cta_secondary: null,
        }),
      ],
    },
    seo: {
      [LOCALE]: {
        title: INDEX_TITLE,
        description:
          "Avvisi, bandi, gare e manifestazioni di interesse del Dipartimento per la trasformazione digitale.",
        image: null,
        no_index: false,
        twitter_card: null,
      },
    },
  });
  await to.items.publish(created.id);
  console.log(`pagina indice creata e pubblicata: ${created.id}`);
  return created.id;
}

const targetTagIdByName = new Map(
  (await listTarget("tag")).map((tag) => [normalize(tag.name), tag.id]),
);
const targetTargetIdByLabel = new Map(
  (await listTarget("target")).map((entry) => [
    normalize(value(entry.label)),
    entry.id,
  ]),
);
const existingIdBySlug = new Map(
  (await listTarget("announcement")).map((record) => [
    value(record.slug),
    record.id,
  ]),
);

const announcements = [];
for await (const record of from.items.listPagedIterator({
  filter: { type: sourceTypeId("announcement") },
  version: "current",
  nested: true,
  order_by: "date_shown_DESC",
}))
  announcements.push(record);

console.log(
  COMMIT
    ? `IMPORT avvisi pubblici -> ${TARGET_ENV} (scritture attive)`
    : `DRY-RUN avvisi pubblici -> ${TARGET_ENV} (usa --commit per scrivere)`,
);
console.log(
  `sorgente: ${announcements.length} avvisi | già importati: ${existingIdBySlug.size}\n`,
);

const parentPage = await findOrCreateIndexPage();

if (COMMIT) {
  const missingTags = new Map();
  for (const announcement of announcements) {
    for (const tagId of announcement.tags ?? []) {
      const tag = await sourceItem(tagId);
      const name = text(tag.name);
      if (!name || targetTagIdByName.has(normalize(name))) continue;
      missingTags.set(normalize(name), name);
    }
  }
  for (const [key, name] of missingTags) {
    const created = await to.items.create({
      item_type: { type: "item_type", id: targetTypeId("tag") },
      name,
    });
    await to.items.publish(created.id);
    targetTagIdByName.set(key, created.id);
    console.log(`tag creato: ${name}`);
  }
}

let created = 0;
let refreshed = 0;
let skipped = 0;
let failed = 0;

for (const announcement of announcements.slice(
  0,
  LIMIT === Infinity ? undefined : LIMIT,
)) {
  const slug = value(announcement.slug);
  const title = text(value(announcement.title));
  const existingId = existingIdBySlug.get(slug);
  if (existingId && !REFRESH) {
    skipped += 1;
    if (!ONLY_MISSING)
      console.log(`${slug.slice(0, 52).padEnd(54)} già presente`);
    continue;
  }

  const statusName = statusNameById.get(
    value(announcement.announcement_status),
  );
  const status = STATUS_BY_SOURCE_NAME[statusName] ?? "closed";
  const categorySlug = categorySlugById.get(
    value(announcement.announcement_category),
  );
  const category = CATEGORY_BY_SOURCE_SLUG[categorySlug] ?? "notice";
  const seo = seoValue(announcement.seo);
  const abstract = text(seo.description);

  const tagIds = [];
  for (const tagId of announcement.tags ?? []) {
    const tag = await sourceItem(tagId);
    const mapped = targetTagIdByName.get(normalize(tag.name));
    if (mapped) tagIds.push(mapped);
    else droppedTags.add(text(tag.name));
  }
  const targetIds = [];
  for (const targetId of announcement.targets ?? []) {
    const target = await sourceItem(targetId);
    const mapped = targetTargetIdByLabel.get(normalize(value(target.name)));
    if (mapped) targetIds.push(mapped);
  }
  if ((announcement.owners ?? []).length) droppedFields.add("owners");

  console.log(
    `${slug.slice(0, 52).padEnd(54)} ${category.padEnd(22)} ${status.padEnd(9)} att=${(announcement.attachments ?? []).length} link=${(announcement.links ?? []).length} tag=${tagIds.length}/${(announcement.tags ?? []).length} target=${targetIds.length}`,
  );
  if (!COMMIT) continue;

  try {
    const nodes = await buildContent(announcement);
    const payload = {
      title: { [LOCALE]: title },
      slug: { [LOCALE]: slug },
      parent_page: { [LOCALE]: parentPage },
      announcement_category: category,
      announcement_status: status,
      open_date: dateOnly(value(announcement.announcement_date_opening)),
      close_date: dateOnly(value(announcement.announcement_date_closing)),
      show_date_after_closed: Boolean(
        value(announcement.show_date_after_closed),
      ),
      office: { [LOCALE]: text(value(announcement.announcement_owner)) },
      office_link: {
        [LOCALE]: text(value(announcement.announcement_owner_link)),
      },
      abstract: { [LOCALE]: abstract },
      topics: { [LOCALE]: tagIds },
      targets: targetIds,
      sort_date: dateOnly(
        value(announcement.date_shown) ??
          announcement.meta.first_published_at ??
          announcement.meta.created_at,
      ),
      show_sidebar: true,
      seo: {
        [LOCALE]: {
          title: clamp(seo.title || title, 60),
          description: clamp(seo.description, 160),
          image: null,
          no_index: false,
          twitter_card: null,
        },
      },
      content: {
        [LOCALE]: [
          block("hero", {
            variant: "default",
            background_color: "lighter",
            show_breadcrumb: true,
            title,
            paragraph: abstract,
            background_image: null,
            background_image_for_mobile: null,
            cta: null,
          }),
          block("structured_text", {
            background_color: "default",
            font_serif: false,
            show_page_index: false,
            content: {
              schema: "dast",
              document: { type: "root", children: nodes },
            },
          }),
        ],
      },
    };
    const record = existingId
      ? await withRetry(slug, () => to.items.update(existingId, payload))
      : await withRetry(slug, () =>
          to.items.create({
            item_type: { type: "item_type", id: targetTypeId("announcement") },
            ...payload,
          }),
        );
    if (announcement.meta.status === "published")
      await withRetry(`publish ${slug}`, () => to.items.publish(record.id));
    existingIdBySlug.set(slug, record.id);
    if (existingId) refreshed += 1;
    else created += 1;
  } catch (error) {
    failed += 1;
    console.log(`   ERRORE: ${String(error?.message ?? error).slice(0, 200)}`);
  }
}

async function wireRelatedContent() {
  const pending = announcements.filter(
    (announcement) =>
      (announcement.related_items ?? []).length ||
      (announcement.related_announcement_items ?? []).length,
  );
  console.log(`\navvisi con contenuti collegati: ${pending.length}`);
  if (!COMMIT || !pending.length) return;

  const articleIdBySlug = new Map(
    (await listTarget("article")).map((record) => [
      value(record.slug),
      record.id,
    ]),
  );
  let wired = 0;
  for (const announcement of pending) {
    const slug = value(announcement.slug);
    const selfId = existingIdBySlug.get(slug);
    if (!selfId) continue;
    const linked = [];
    for (const relatedId of [
      ...(announcement.related_items ?? []),
      ...(announcement.related_announcement_items ?? []),
    ]) {
      const related = await sourceItem(relatedId);
      const relatedSlug = value(related.slug);
      const mapped =
        existingIdBySlug.get(relatedSlug) ?? articleIdBySlug.get(relatedSlug);
      if (!mapped) {
        droppedRelated.add(relatedSlug);
        continue;
      }
      if (mapped === selfId || linked.includes(mapped)) continue;
      const target = await to.items.find(mapped);
      if (target.meta.status !== "published") {
        unpublishedRelated.add(relatedSlug);
        continue;
      }
      linked.push(mapped);
    }
    if (!linked.length) continue;
    await withRetry(`related ${slug}`, () =>
      to.items.update(selfId, { related_content: linked }),
    );
    if (announcement.meta.status === "published")
      await withRetry(`publish ${slug}`, () => to.items.publish(selfId));
    console.log(`${slug.slice(0, 52).padEnd(54)} collegati: ${linked.length}`);
    wired += 1;
  }
  console.log(`contenuti collegati scritti su ${wired} avvisi`);
}

await wireRelatedContent();

console.log(
  COMMIT
    ? `\ncreati: ${created} | aggiornati: ${refreshed} | già presenti: ${skipped} | errori: ${failed}`
    : "\n--- anteprima, nessuna scrittura ---",
);
if (droppedTags.size)
  console.log(`tag senza corrispondenza: ${[...droppedTags].join(", ")}`);
if (droppedBlocks.size)
  console.log(`blocchi non convertiti: ${[...droppedBlocks].join(", ")}`);
if (droppedRelated.size)
  console.log(
    `contenuti collegati non trovati in destinazione: ${[...droppedRelated].join(", ")}`,
  );
if (unpublishedRelated.size)
  console.log(
    `contenuti collegati ancora in bozza, non agganciati: ${[...unpublishedRelated].join(", ")}`,
  );
if (droppedFields.size)
  console.log(
    `campi sorgente senza destinazione: ${[...droppedFields].join(", ")}`,
  );
