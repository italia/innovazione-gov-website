import { buildBlockRecord, buildClient } from "@datocms/cma-client-node";
import {
  dastDocument,
  headingNode,
  markdownToDastNodes,
} from "./lib/markdown-to-dast.mjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const COMMIT = process.argv.includes("--commit");
const limitFlagIndex = process.argv.indexOf("--limit");
const LIMIT =
  limitFlagIndex === -1 ? null : Number(process.argv[limitFlagIndex + 1]);

const TARGET_ENV = "website-astro-2026";
const SOURCE_MODEL = "project";
const ARTICLE_TYPE = "project";
const LOCALE = "it";
const GALLERY_RATIO = "16x9";
const PARENT_PAGE = "O-jJWH1XQUCeSKtIV8PT1Q";

const from = buildClient({
  apiToken: process.env.DATOCMS_FROM_IMPORT,
  requestTimeout: 60000,
});
const to = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: TARGET_ENV,
  requestTimeout: 60000,
});

const localeValue = (field) =>
  field && typeof field === "object" ? (field[LOCALE] ?? "") : (field ?? "");

const norm = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const clampSeo = (value, max) => {
  const text = String(value ?? "").trim();
  if (text.length <= max) return text || null;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim();
};

const uploadIdBySourceId = new Map();

async function copyUpload(sourceUploadId) {
  if (uploadIdBySourceId.has(sourceUploadId))
    return uploadIdBySourceId.get(sourceUploadId);
  const source = await from.uploads.find(sourceUploadId);
  const created = await to.uploads.createFromUrl({
    url: source.url,
    filename: source.filename,
    skipCreationIfAlreadyExists: true,
  });
  uploadIdBySourceId.set(sourceUploadId, created.id);
  return created.id;
}

const sourceItemCache = new Map();

async function sourceItem(id) {
  if (!sourceItemCache.has(id))
    sourceItemCache.set(id, await from.items.find(id, { nested: true }));
  return sourceItemCache.get(id);
}

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

const droppedTags = new Set();
const droppedBlocks = new Set();
const droppedFields = new Set();

const blocksOf = (field) =>
  Array.isArray(field) ? field : (field?.[LOCALE] ?? []);

const paragraphNode = (text) => markdownToDastNodes(text);

function calloutNode(targetTypeIdByKey, title, paragraph) {
  return {
    type: "block",
    item: buildBlockRecord({
      item_type: { id: targetTypeIdByKey.callout, type: "item_type" },
      title,
      paragraph,
    }),
  };
}

async function buildContent(sourceRecord, blockApiKeyById, targetTypeIdByKey) {
  const children = [];

  for (const block of blocksOf(sourceRecord.state_block)) {
    const attributes = block.attributes ?? block;
    const completed = Boolean(attributes.completed);
    const date = String(attributes.date_completed ?? "").slice(0, 10);
    const warning = String(attributes.warning_text ?? "").trim();
    const parts = [];
    if (date) parts.push(`Data di completamento: ${date}.`);
    if (warning) parts.push(warning);
    children.push(
      calloutNode(
        targetTypeIdByKey,
        completed ? "Progetto concluso" : "Stato del progetto",
        parts.join(" ") ||
          (completed ? "Il progetto è concluso." : "Il progetto è in corso."),
      ),
    );
  }

  for (const block of blocksOf(sourceRecord.content_blocks)) {
    const kind =
      blockApiKeyById[
        block.relationships?.item_type?.data?.id ?? block.item_type?.id
      ];
    const attributes = block.attributes ?? block;

    if (kind === "block_body_text") {
      const heading = String(attributes.text_title ?? "").trim();
      if (heading) children.push(headingNode(heading, 3));
      children.push(...markdownToDastNodes(attributes.body_text));
      continue;
    }

    if (kind === "block_cta") {
      for (const ctaId of attributes.cta_items ?? []) {
        const cta = await sourceItem(ctaId);
        const url = String(cta.link ?? "").trim();
        const label = String(cta.cta_label || cta.title || "").trim();
        if (!url || !label) continue;
        children.push({
          type: "block",
          item: buildBlockRecord({
            item_type: {
              id: targetTypeIdByKey.external_link,
              type: "item_type",
            },
            label,
            url,
            description: String(cta.description ?? "").trim(),
          }),
        });
      }
      continue;
    }

    if (kind === "block_accordion") {
      for (const itemId of attributes.accordion_items ?? []) {
        const item = await sourceItem(itemId);
        const heading = String(item.title ?? item.header ?? "").trim();
        if (heading) children.push(headingNode(heading, 3));
        children.push(
          ...paragraphNode(item.body ?? item.text ?? item.body_text),
        );
      }
      continue;
    }

    if (kind === "block_number") {
      const heading = String(attributes.block_number_title ?? "").trim();
      if (heading) children.push(headingNode(heading, 3));
      for (const numberId of attributes.numbers ?? []) {
        const number = await sourceItem(numberId);
        const value = String(
          number.number ?? number.value ?? number.title ?? "",
        ).trim();
        const label = String(
          number.label ?? number.description ?? number.text ?? "",
        ).trim();
        if (value || label)
          children.push(
            calloutNode(targetTypeIdByKey, value || label, label || value),
          );
      }
      continue;
    }

    if (kind === "block_image_single") {
      if (attributes.image?.upload_id) {
        const uploadId = COMMIT
          ? await copyUpload(attributes.image.upload_id)
          : "dry-run";
        children.push({
          type: "block",
          item: buildBlockRecord({
            item_type: { id: targetTypeIdByKey.image_block, type: "item_type" },
            image: { upload_id: uploadId },
            ratio: GALLERY_RATIO,
          }),
        });
      }
      continue;
    }

    if (kind === "block_image_gallery") {
      for (const image of attributes.images ?? []) {
        const uploadId = COMMIT ? await copyUpload(image.upload_id) : "dry-run";
        children.push({
          type: "block",
          item: buildBlockRecord({
            item_type: { id: targetTypeIdByKey.image_block, type: "item_type" },
            image: { upload_id: uploadId },
            ratio: GALLERY_RATIO,
          }),
        });
      }
      continue;
    }

    if (kind === "block_video_single") {
      const video = attributes.video ?? {};
      if (video.url)
        children.push({
          type: "block",
          item: buildBlockRecord({
            item_type: {
              id: targetTypeIdByKey.external_link,
              type: "item_type",
            },
            label: String(video.title || "Guarda il video").trim(),
            url: video.url,
            description: "",
          }),
        });
      children.push(...markdownToDastNodes(attributes.transcription));
      continue;
    }

    droppedBlocks.add(kind ?? "sconosciuto");
  }

  const credits = String(localeValue(sourceRecord.credits) ?? "").trim();
  if (credits) {
    children.push(headingNode("Crediti", 3));
    children.push(...markdownToDastNodes(credits));
  }

  return dastDocument(children);
}

async function createAttachments(sourceRecord) {
  const ids = [];
  for (const attachmentId of sourceRecord.attachments ?? []) {
    const attachment = await sourceItem(attachmentId);
    if (!attachment.file?.upload_id) continue;
    const uploadId = await copyUpload(attachment.file.upload_id);
    const created = await to.items.create({
      item_type: { id: (await targetTypes()).attachment, type: "item_type" },
      file: { upload_id: uploadId },
      file_title: attachment.file_title ?? "",
      file_description: attachment.file_description ?? "",
    });
    await to.items.publish(created.id);
    ids.push(created.id);
  }
  return ids;
}

async function createLinks(sourceRecord) {
  const ids = [];
  const seenUrls = new Set();
  const linkIds = [
    ...(sourceRecord.links ?? []),
    ...(sourceRecord.links_external_project_card ?? []),
    ...(sourceRecord.link_external_project_website
      ? [sourceRecord.link_external_project_website]
      : []),
  ];
  for (const linkId of linkIds) {
    const link = await sourceItem(linkId);
    if (!link.link) continue;
    const url = String(link.link).trim().replace(/\/$/, "");
    if (seenUrls.has(url)) continue;
    seenUrls.add(url);
    const created = await to.items.create({
      item_type: { id: (await targetTypes()).link_external, type: "item_type" },
      title: String(link.title ?? "").trim(),
      description: String(link.description ?? "").trim(),
      link: link.link,
      cta_label: String(link.cta_label ?? "").trim(),
    });
    await to.items.publish(created.id);
    ids.push(created.id);
  }
  return ids;
}

let targetTypesCache = null;

async function targetTypes() {
  if (!targetTypesCache) {
    const types = await to.itemTypes.list();
    targetTypesCache = Object.fromEntries(
      types.map((type) => [type.api_key, type.id]),
    );
  }
  return targetTypesCache;
}

async function upsert(payload, slug, title) {
  let attempt = 1;
  for (;;) {
    const suffix = attempt === 1 ? "" : `-${attempt}`;
    const titleSuffix = attempt === 1 ? "" : ` (${attempt})`;
    try {
      return await to.items.create({
        ...payload,
        slug: { [LOCALE]: `${slug}${suffix}` },
        title: { [LOCALE]: `${title}${titleSuffix}` },
      });
    } catch (error) {
      const isUnique = JSON.stringify(
        error.errors ?? error.message ?? "",
      ).includes("VALIDATION_UNIQUE");
      if (!isUnique || attempt > 5) throw error;
      attempt += 1;
    }
  }
}

async function run() {
  console.log(
    COMMIT
      ? `IMPORT progetti -> ${TARGET_ENV} (scritture attive)`
      : `DRY-RUN progetti -> ${TARGET_ENV} (usa --commit per scrivere)`,
  );

  const sourceTypes = await from.itemTypes.list();
  const blockApiKeyById = Object.fromEntries(
    sourceTypes.map((type) => [type.id, type.api_key]),
  );
  const sourceModel = sourceTypes.find((type) => type.api_key === SOURCE_MODEL);
  const sourceRecords = await listAll(from, { type: sourceModel.id });
  sourceRecords.sort((a, b) =>
    String(localeValue(a.title)).localeCompare(String(localeValue(b.title))),
  );

  const targetTypeIdByKey = await targetTypes();

  const targetTags = await listAll(to, { type: targetTypeIdByKey.tag });
  const tagIdByName = new Map(
    targetTags.map((tag) => [norm(tag.name), tag.id]),
  );
  const targetTargets = await listAll(to, { type: targetTypeIdByKey.target });
  const targetIdByLabel = new Map(
    targetTargets.map((item) => [norm(localeValue(item.label)), item.id]),
  );

  if (COMMIT) {
    const missing = new Map();
    for (const record of sourceRecords) {
      for (const tagId of record.tags ?? []) {
        const tag = await sourceItem(tagId);
        const name = String(tag.name ?? "").trim();
        if (!name || tagIdByName.has(norm(name))) continue;
        missing.set(norm(name), name);
      }
    }
    for (const [key, name] of missing) {
      const created = await to.items.create({
        item_type: { id: targetTypeIdByKey.tag, type: "item_type" },
        name,
      });
      await to.items.publish(created.id);
      tagIdByName.set(key, created.id);
      console.log(`tag creato: ${name}`);
    }
  }

  const existingArticles = await listAll(to, {
    type: targetTypeIdByKey.article,
  });
  const existingByType = existingArticles.filter(
    (article) => article.article_type === ARTICLE_TYPE,
  );
  const existingBySlug = new Map(
    existingByType.map((article) => [localeValue(article.slug), article]),
  );

  console.log(
    `sorgente: ${sourceRecords.length} record (${sourceRecords.filter((r) => r.meta.status === "published").length} published, ${sourceRecords.filter((r) => r.meta.status === "draft").length} draft)`,
  );
  console.log(
    `destinazione: ${existingByType.length} articoli article_type=${ARTICLE_TYPE} già presenti`,
  );

  const records = LIMIT ? sourceRecords.slice(0, LIMIT) : sourceRecords;
  let created = 0;
  let updated = 0;
  let published = 0;
  let draftKept = 0;

  for (const record of records) {
    const slug = localeValue(record.slug);
    const title = localeValue(record.title);
    const abstract =
      localeValue(record.summary).trim() || localeValue(record.subtitle).trim();
    const existing = existingBySlug.get(slug);

    const tagIds = [];
    for (const tagId of record.tags ?? []) {
      const tag = await sourceItem(tagId);
      const mapped = tagIdByName.get(norm(tag.name));
      if (mapped) tagIds.push(mapped);
      else droppedTags.add(String(tag.name ?? "").trim());
    }
    const targetIds = [];
    for (const targetId of record.targets ?? []) {
      const target = await sourceItem(targetId);
      const mapped = targetIdByLabel.get(norm(localeValue(target.name)));
      if (mapped) targetIds.push(mapped);
    }

    if (record.category) droppedFields.add("category");
    if (record.image_project_logo?.upload_id)
      droppedFields.add("image_project_logo");
    if (record.dashboard_embed) droppedFields.add("dashboard_embed");
    if ((record.related_items ?? []).length) droppedFields.add("related_items");
    if ((record.related_announcement_items ?? []).length)
      droppedFields.add("related_announcement_items");
    if (record.highlight) droppedFields.add("highlight");

    if (!COMMIT) {
      const blocks = blocksOf(record.content_blocks).map(
        (block) =>
          blockApiKeyById[
            block.relationships?.item_type?.data?.id ?? block.item_type?.id
          ],
      );
      console.log(
        `[dry] ${record.meta.status.padEnd(9)} ${slug} | img=${record.image_thumbnail ? "sì" : "no"} | tag=${tagIds.length}/${(record.tags ?? []).length} | target=${targetIds.length} | att=${(record.attachments ?? []).length} | link=${(record.links ?? []).length} | blocchi=${blocks.join(",") || "-"} | ${existing ? "AGGIORNA" : "CREA"}`,
      );
      await buildContent(record, blockApiKeyById, targetTypeIdByKey);
      continue;
    }

    const content = await buildContent(
      record,
      blockApiKeyById,
      targetTypeIdByKey,
    );
    const imageUploadId = record.image_thumbnail?.upload_id
      ? await copyUpload(record.image_thumbnail.upload_id)
      : null;

    const payload = {
      item_type: { id: targetTypeIdByKey.article, type: "item_type" },
      article_type: ARTICLE_TYPE,
      undersecretary: false,
      show_sidebar: true,
      parent_page: { [LOCALE]: PARENT_PAGE },
      paragraph: { [LOCALE]: abstract },
      description: { [LOCALE]: abstract },
      description_title: { [LOCALE]: "" },
      image: imageUploadId
        ? { [LOCALE]: { upload_id: imageUploadId } }
        : { [LOCALE]: null },
      content: { [LOCALE]: content },
      date_shown:
        record.date_shown ??
        record.meta.first_published_at ??
        record.meta.created_at ??
        null,
      seo: {
        [LOCALE]: {
          title: clampSeo(localeValue(record.seo)?.title, 60),
          description: clampSeo(localeValue(record.seo)?.description, 160),
          image: null,
          twitter_card: null,
          no_index: false,
        },
      },
      tags: tagIds,
      targets: targetIds,
    };

    let item;
    if (existing) {
      const attachments = (existing.attachments ?? []).length
        ? existing.attachments
        : await createAttachments(record);
      const links = (existing.links ?? []).length
        ? existing.links
        : await createLinks(record);
      item = await to.items.update(existing.id, {
        ...payload,
        attachments,
        links,
      });
      updated += 1;
    } else {
      const attachments = await createAttachments(record);
      const links = await createLinks(record);
      item = await upsert({ ...payload, attachments, links }, slug, title);
      created += 1;
    }

    if (record.meta.status === "published") {
      await to.items.publish(item.id);
      published += 1;
    } else {
      draftKept += 1;
    }
    console.log(
      `${existing ? "aggiornato" : "creato"} ${record.meta.status.padEnd(9)} ${localeValue(item.slug)}`,
    );
  }

  console.log(
    `\ncreati: ${created} | aggiornati: ${updated} | pubblicati: ${published} | lasciati in draft: ${draftKept}`,
  );
  if (droppedTags.size)
    console.log(
      `tag non presenti in destinazione (ignorati): ${[...droppedTags].join(", ")}`,
    );
  if (droppedBlocks.size)
    console.log(
      `blocchi sorgente non convertiti: ${[...droppedBlocks].join(", ")}`,
    );
  if (droppedFields.size)
    console.log(
      `campi sorgente senza destinazione: ${[...droppedFields].join(", ")}`,
    );
}

await run();
