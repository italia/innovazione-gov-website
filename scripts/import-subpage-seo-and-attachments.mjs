import { buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const COMMIT = process.argv.includes("--commit");
const TARGET_ENV = "website-astro-2026";
const LOCALE = "it";
const SOURCE_MODELS = [
  "department_subpage",
  "undersecretary_subpage",
  "minister_subpage",
  "general_page",
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

async function copyUpload(sourceUploadId) {
  const source = await from.uploads.find(sourceUploadId);
  const created = await to.uploads.createFromUrl({
    url: source.url,
    filename: source.filename,
    skipCreationIfAlreadyExists: true,
  });
  return created.id;
}

async function createAttachments(sourceItem, attachmentTypeId) {
  const ids = [];
  for (const attachmentId of sourceItem.attachments ?? []) {
    const attachment = await from.items.find(attachmentId, { nested: true });
    if (!attachment.file?.upload_id) continue;
    const created = await to.items.create({
      item_type: { id: attachmentTypeId, type: "item_type" },
      file: { upload_id: await copyUpload(attachment.file.upload_id) },
      file_title: attachment.file_title ?? "",
      file_description: attachment.file_description ?? "",
    });
    await to.items.publish(created.id);
    ids.push(created.id);
  }
  return ids;
}

console.log(
  COMMIT
    ? `IMPORT seo + allegati sottopagine -> ${TARGET_ENV} (scritture attive)`
    : `DRY-RUN seo + allegati sottopagine -> ${TARGET_ENV} (usa --commit per scrivere)`,
);

const sourceTypes = await from.itemTypes.list();
const sourceBySlug = new Map();
for (const apiKey of SOURCE_MODELS) {
  const model = sourceTypes.find((type) => type.api_key === apiKey);
  if (!model) continue;
  for (const item of await listAll(from, { type: model.id })) {
    const slug = item.slug?.[LOCALE];
    if (slug && !sourceBySlug.has(slug)) sourceBySlug.set(slug, item);
  }
}

const targetTypes = await to.itemTypes.list();
const attachmentTypeId = targetTypes.find(
  (type) => type.api_key === "attachment",
).id;
const insightTypeId = targetTypes.find((type) => type.api_key === "insight").id;
const subpages = await listAll(to, { type: insightTypeId });

let seoUpdated = 0;
let attachmentsAdded = 0;

for (const subpage of subpages) {
  const slug = subpage.slug?.[LOCALE];
  const source = sourceBySlug.get(slug);
  if (!source) continue;

  const sourceSeo = source.seo?.[LOCALE];
  const hasSeo = !!(
    subpage.seo?.[LOCALE]?.title || subpage.seo?.[LOCALE]?.description
  );
  const needsSeo = !hasSeo && !!(sourceSeo?.title || sourceSeo?.description);
  const missingAttachments =
    (source.attachments ?? []).length > 0 &&
    (subpage.attachments ?? []).length === 0;

  if (!needsSeo && !missingAttachments) continue;

  console.log(
    `${COMMIT ? "" : "[dry] "}${slug}: ${needsSeo ? "seo" : "-"} | allegati ${missingAttachments ? (source.attachments ?? []).length : 0}`,
  );

  if (!COMMIT) continue;

  const payload = {};
  if (needsSeo) {
    payload.seo = {
      [LOCALE]: {
        title: sourceSeo.title ?? null,
        description: sourceSeo.description ?? null,
        image: null,
        no_index: sourceSeo.no_index ?? false,
        twitter_card: null,
      },
    };
    seoUpdated += 1;
  }
  if (missingAttachments) {
    payload.attachments = await createAttachments(source, attachmentTypeId);
    attachmentsAdded += payload.attachments.length;
  }

  await to.items.update(subpage.id, payload);
  if (subpage.meta.status !== "draft") await to.items.publish(subpage.id);
}

console.log(
  `\nseo impostate: ${seoUpdated} | allegati collegati: ${attachmentsAdded}`,
);
