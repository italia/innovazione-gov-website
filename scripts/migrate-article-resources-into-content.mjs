import { buildBlockRecord, buildClient } from "@datocms/cma-client-node";
import { dastDocument, headingNode } from "./lib/markdown-to-dast.mjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const COMMIT = process.argv.includes("--commit");
const limitFlagIndex = process.argv.indexOf("--limit");
const LIMIT =
  limitFlagIndex === -1 ? null : Number(process.argv[limitFlagIndex + 1]);

const TARGET_ENV = "website-astro-2026";
const LOCALE = "it";

const to = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: TARGET_ENV,
  requestTimeout: 60000,
});

const types = await to.itemTypes.list();
const T = Object.fromEntries(types.map((type) => [type.api_key, type.id]));
const apiKeyById = Object.fromEntries(
  types.map((type) => [type.id, type.api_key]),
);

const localeValue = (field) =>
  field && typeof field === "object" && !Array.isArray(field)
    ? (field[LOCALE] ?? null)
    : (field ?? null);

const blockOf = (key, attributes) =>
  buildBlockRecord({
    item_type: { id: T[key], type: "item_type" },
    ...attributes,
  });

const alreadyMigrated = (document) =>
  JSON.stringify(document ?? {}).includes("DownloadLinkRecord") ||
  (document?.document?.children ?? []).some(
    (node) =>
      node.type === "block" &&
      typeof node.item === "object" &&
      ["download_link", "list_external_link"].includes(
        apiKeyById[node.item?.relationships?.item_type?.data?.id],
      ),
  );

async function resourceBlocks(article) {
  const blocks = [];

  const attachmentIds = article.attachments ?? [];
  if (attachmentIds.length) {
    const downloads = [];
    for (const id of attachmentIds) {
      const attachment = await to.items.find(id, { version: "current" });
      const upload = attachment.file?.upload_id;
      if (!upload) continue;
      downloads.push(
        blockOf("download_link", {
          doc: { upload_id: upload },
          label: String(attachment.file_title ?? "").trim() || "Allegato",
          description: String(attachment.file_description ?? "").trim(),
        }),
      );
    }
    if (downloads.length) {
      blocks.push(headingNode("Allegati", 3));
      for (const download of downloads)
        blocks.push({ type: "block", item: download });
    }
  }

  const linkIds = article.links ?? [];
  if (linkIds.length) {
    const externals = [];
    for (const id of linkIds) {
      const link = await to.items.find(id, { version: "current" });
      const url = String(link.link ?? "").trim();
      if (!url) continue;
      externals.push(
        blockOf("external_link", {
          label: String(link.title ?? "").trim() || url,
          url,
          description: String(link.description ?? "").trim(),
        }),
      );
    }
    if (externals.length) {
      blocks.push(headingNode("Collegamenti utili", 3));
      blocks.push({
        type: "block",
        item: blockOf("list_external_link", { links: externals }),
      });
    }
  }

  return blocks;
}

const articles = [];
for await (const article of to.items.listPagedIterator({
  filter: { type: T.article },
  version: "current",
})) {
  if ((article.attachments ?? []).length || (article.links ?? []).length)
    articles.push(article);
}

console.log(
  COMMIT
    ? `SPOSTAMENTO allegati e link dentro content -> ${articles.length} articoli`
    : `DRY-RUN su ${articles.length} articoli (usa --commit per scrivere)`,
);

let migrati = 0;
let saltati = 0;
const records = LIMIT ? articles.slice(0, LIMIT) : articles;

for (const article of records) {
  const slug = localeValue(article.slug);
  const document = localeValue(article.content);
  if (document && alreadyMigrated(document)) {
    saltati += 1;
    continue;
  }

  if (!COMMIT) {
    console.log(
      `[dry] ${slug} | allegati=${(article.attachments ?? []).length} | link=${(article.links ?? []).length}`,
    );
    migrati += 1;
    continue;
  }

  const blocks = await resourceBlocks(article);
  if (!blocks.length) {
    saltati += 1;
    continue;
  }

  // Gli articoli senza corpo — capita su qualche bozza con il solo allegato —
  // ricevono un documento nuovo con le sole risorse.
  const nuovo = document
    ? {
        ...document,
        document: {
          ...document.document,
          children: [...document.document.children, ...blocks],
        },
      }
    : dastDocument(blocks);

  const stato = article.meta.status;
  await to.items.update(article.id, {
    content: { [LOCALE]: nuovo },
    attachments: [],
    links: [],
  });
  if (stato === "published") await to.items.publish(article.id);
  migrati += 1;
  if (migrati % 25 === 0) console.log(`  ...${migrati} articoli`);
}

console.log(`\nmigrati: ${migrati} | saltati: ${saltati}`);
