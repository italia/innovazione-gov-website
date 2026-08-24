import { buildBlockRecord, buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";
import {
  dastDocument,
  headingNode,
  markdownToDastNodes,
} from "./lib/markdown-to-dast.mjs";

dotenv.config({ path: ".env" });

const COMMIT = process.argv.includes("--commit");
const TARGET_ENV = "website-astro-2026";
const SOURCE_MODEL = "undersecretary_subpage";
const LOCALE = "it";

const SUBPAGES = [{ sourceSlug: "deleghe", parentPageSlug: "sottosegretario" }];

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

function blockKindResolver(types) {
  const apiKeyById = Object.fromEntries(
    types.map((type) => [type.id, type.api_key]),
  );
  return (block) =>
    apiKeyById[block.relationships?.item_type?.data?.id ?? block.item_type?.id];
}

function parentPageImage(parentPage, kindOf) {
  for (const block of parentPage.content?.[LOCALE] ?? []) {
    if (kindOf(block) !== "text_image") continue;
    const image = block.attributes?.image;
    if (image?.upload_id) return image;
  }
  return null;
}

const LIST_INTRODUCTION_MAX_LENGTH = 140;

function hasHeadings(body) {
  return (body?.document.children ?? []).some(
    (node) => node.type === "heading",
  );
}

function paragraphText(node) {
  return (node.children ?? [])
    .map((child) => child.value ?? "")
    .join("")
    .trim();
}

function promoteListIntroductionsToHeadings(nodes) {
  return nodes.map((node, index) => {
    if (node.type !== "paragraph") return node;
    if (nodes[index + 1]?.type !== "list") return node;
    const text = paragraphText(node);
    if (!text.endsWith(":") || text.length > LIST_INTRODUCTION_MAX_LENGTH)
      return node;
    return headingNode(text.replace(/:$/, ""), 2);
  });
}

async function buildBody(sourceSubpage, kindOfSource) {
  const children = [];

  for (const block of sourceSubpage.content_blocks?.[LOCALE] ?? []) {
    if (kindOfSource(block) !== "block_body_text") continue;
    const heading = String(block.attributes?.text_title ?? "").trim();
    if (heading) children.push(headingNode(heading, 2));
    children.push(
      ...promoteListIntroductionsToHeadings(
        markdownToDastNodes(block.attributes?.body_text),
      ),
    );
  }

  return dastDocument(children);
}

async function createAttachments(sourceSubpage, targetTypeIdByKey) {
  const ids = [];
  for (const attachmentId of sourceSubpage.attachments ?? []) {
    const attachment = await from.items.find(attachmentId, { nested: true });
    if (!attachment.file?.upload_id) continue;
    const created = await to.items.create({
      item_type: { id: targetTypeIdByKey.attachment, type: "item_type" },
      file: { upload_id: await copyUpload(attachment.file.upload_id) },
      file_title: attachment.file_title ?? "",
      file_description: attachment.file_description ?? "",
    });
    await to.items.publish(created.id);
    ids.push(created.id);
  }
  return ids;
}

async function createLinks(sourceSubpage, targetTypeIdByKey) {
  const ids = [];
  for (const linkId of sourceSubpage.links ?? []) {
    const link = await from.items.find(linkId, { nested: true });
    if (!link.link) continue;
    const created = await to.items.create({
      item_type: { id: targetTypeIdByKey.link_external, type: "item_type" },
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

async function relinkParentCta(parentPage, subpageId, kindOf, subpageTitle) {
  const isBlock = (value) =>
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !!(value.relationships?.item_type?.data?.id ?? value.item_type?.id);

  let relinked = 0;

  const rebuild = (block) => {
    const attributes = {};
    for (const [key, value] of Object.entries(block.attributes ?? {})) {
      if (isBlock(value)) attributes[key] = rebuild(value);
      else if (Array.isArray(value) && value.some(isBlock))
        attributes[key] = value.map((entry) =>
          isBlock(entry) ? rebuild(entry) : entry,
        );
      else attributes[key] = value;
    }
    const matchesSubpage = String(attributes.label ?? "")
      .toLowerCase()
      .includes(subpageTitle.toLowerCase());
    if (
      kindOf(block) === "internal_link" &&
      matchesSubpage &&
      attributes.link_to !== subpageId
    ) {
      attributes.link_to = subpageId;
      relinked += 1;
    }
    return {
      type: "item",
      id: block.id,
      attributes,
      relationships: block.relationships,
    };
  };

  const content = Object.fromEntries(
    Object.entries(parentPage.content ?? {}).map(([locale, blocks]) => [
      locale,
      (blocks ?? []).map(rebuild),
    ]),
  );

  if (!relinked) {
    console.log("   CTA nella pagina padre: nessuna da aggiornare");
    return;
  }
  console.log(
    `   ${COMMIT ? "aggiornate" : "[dry] aggiornerei"} ${relinked} CTA nella pagina padre -> ${subpageId}`,
  );
  if (!COMMIT) return;
  await to.items.update(parentPage.id, { content });
  await to.items.publish(parentPage.id);
}

console.log(
  COMMIT
    ? `IMPORT sottopagine -> ${TARGET_ENV} (scritture attive)`
    : `DRY-RUN sottopagine -> ${TARGET_ENV} (usa --commit per scrivere)`,
);

const sourceTypes = await from.itemTypes.list();
const kindOfSource = blockKindResolver(sourceTypes);
const sourceModel = sourceTypes.find((type) => type.api_key === SOURCE_MODEL);
const sourceSubpages = await listAll(from, { type: sourceModel.id });

const targetTypes = await to.itemTypes.list();
const kindOfTarget = blockKindResolver(targetTypes);
const targetTypeIdByKey = Object.fromEntries(
  targetTypes.map((type) => [type.api_key, type.id]),
);
const targetPages = await listAll(to, { type: targetTypeIdByKey.page });
const targetSubpages = await listAll(to, { type: targetTypeIdByKey.insight });

for (const { sourceSlug, parentPageSlug } of SUBPAGES) {
  const source = sourceSubpages.find(
    (item) => localeValue(item.slug) === sourceSlug,
  );
  const parentPage = targetPages.find(
    (page) => localeValue(page.slug) === parentPageSlug,
  );
  if (!source || !parentPage) {
    console.log(`${sourceSlug}: sorgente o pagina padre mancante, salto`);
    continue;
  }

  const title = localeValue(source.title);
  const abstract = localeValue(source.subtitle) || localeValue(source.summary);
  const image = parentPageImage(parentPage, kindOfTarget);
  const body = await buildBody(source, kindOfSource);
  const headings = (body?.document.children ?? []).filter(
    (node) => node.type === "heading",
  ).length;
  const sourceSeo = source.seo?.[LOCALE] ?? null;

  const payload = {
    item_type: { id: targetTypeIdByKey.insight, type: "item_type" },
    parent_page: { [LOCALE]: parentPage.id },
    title: { [LOCALE]: title },
    slug: { [LOCALE]: sourceSlug },
    abstract: { [LOCALE]: abstract },
    image: { [LOCALE]: image },
    content: {
      [LOCALE]: [
        buildBlockRecord({
          item_type: { id: targetTypeIdByKey.hero, type: "item_type" },
          variant: "default",
          background_color: "lighter",
          show_breadcrumb: true,
          title,
          paragraph: abstract,
        }),
        buildBlockRecord({
          item_type: {
            id: targetTypeIdByKey.structured_text,
            type: "item_type",
          },
          background_color: "default",
          show_page_index: hasHeadings(body),
          content: body,
        }),
      ],
    },
    seo: {
      [LOCALE]: sourceSeo
        ? {
            title: sourceSeo.title ?? null,
            description: sourceSeo.description ?? null,
            image: null,
            no_index: sourceSeo.no_index ?? false,
            twitter_card: null,
          }
        : null,
    },
  };

  const existing = targetSubpages.find(
    (item) =>
      localeValue(item.slug) === sourceSlug &&
      localeValue(item.parent_page) === parentPage.id,
  );

  const attachmentCount = (source.attachments ?? []).length;
  const linkCount = (source.links ?? []).length;

  const bodyNodes = body?.document.children.length ?? 0;
  console.log(
    `${COMMIT ? "" : "[dry] "}${existing ? "aggiorno" : "creo"} sottopagina "${title}" sotto /${parentPageSlug} | nodi=${bodyNodes} | titoli=${headings} | allegati=${attachmentCount} | link=${linkCount} | img=${image ? "dalla pagina padre" : "MANCANTE"} | seo=${sourceSeo ? "sì" : "no"}`,
  );

  if (!COMMIT) {
    await relinkParentCta(
      parentPage,
      existing?.id ?? "(nuovo id)",
      kindOfTarget,
      title,
    );
    continue;
  }

  const attachments = (existing?.attachments ?? []).length
    ? existing.attachments
    : await createAttachments(source, targetTypeIdByKey);
  const links = (existing?.links ?? []).length
    ? existing.links
    : await createLinks(source, targetTypeIdByKey);
  const item = existing
    ? await to.items.update(existing.id, { ...payload, attachments, links })
    : await to.items.create({ ...payload, attachments, links });
  await to.items.publish(item.id);
  console.log(`   id: ${item.id}`);
  await relinkParentCta(parentPage, item.id, kindOfTarget, title);
}
