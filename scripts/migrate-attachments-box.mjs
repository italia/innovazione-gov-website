import { buildBlockRecord, buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const COMMIT = process.argv.includes("--commit");
const to = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: "website-astro-2026",
  requestTimeout: 60000,
});
const types = await to.itemTypes.list();
const T = Object.fromEntries(types.map((t) => [t.api_key, t.id]));
const byId = Object.fromEntries(types.map((t) => [t.id, t.api_key]));
const LOCALE = "it";

const kind = (node) =>
  node.type === "block"
    ? byId[node.item?.relationships?.item_type?.data?.id]
    : node.type;
const testo = (node) =>
  (node.children ?? [])
    .map((child) => child.value ?? "")
    .join("")
    .trim();

const articoli = [];
for await (const article of to.items.listPagedIterator({
  filter: { type: T.article },
  version: "current",
  nested: true,
})) {
  const document = article.content?.[LOCALE];
  if (!document) continue;
  const children = document.document.children;
  const indice = children.findIndex(
    (node) =>
      node.type === "heading" && node.level === 3 && testo(node) === "Allegati",
  );
  if (indice === -1) continue;
  if (kind(children[indice + 1]) !== "download_link") continue;
  articoli.push(article);
}

console.log(
  COMMIT
    ? `CONVERSIONE in box allegati -> ${articoli.length} articoli`
    : `DRY-RUN: ${articoli.length} articoli con titolo "Allegati" e file sciolti`,
);
if (!COMMIT) process.exit(0);

let fatti = 0;
for (const article of articoli) {
  const document = article.content[LOCALE];
  const children = document.document.children;
  const indice = children.findIndex(
    (node) =>
      node.type === "heading" && node.level === 3 && testo(node) === "Allegati",
  );
  let fine = indice + 1;
  const scaricabili = [];
  while (fine < children.length && kind(children[fine]) === "download_link") {
    const attributi = children[fine].item.attributes;
    scaricabili.push(
      buildBlockRecord({
        item_type: { id: T.download_link, type: "item_type" },
        doc: attributi.doc,
        label: attributi.label,
        description: attributi.description,
      }),
    );
    fine += 1;
  }

  const box = {
    type: "block",
    item: buildBlockRecord({
      item_type: { id: T.attachments_box, type: "item_type" },
      title: testo(children[indice]),
      downloads: scaricabili,
    }),
  };

  const nuovi = [
    ...children
      .slice(0, indice)
      .map((n) =>
        n.type === "block" ? { type: "block", item: n.item.id } : n,
      ),
    box,
    ...children
      .slice(fine)
      .map((n) =>
        n.type === "block" ? { type: "block", item: n.item.id } : n,
      ),
  ];

  const stato = article.meta.status;
  await to.items.update(article.id, {
    content: {
      [LOCALE]: {
        ...document,
        document: { ...document.document, children: nuovi },
      },
    },
  });
  if (stato === "published") await to.items.publish(article.id);
  fatti += 1;
  if (fatti % 25 === 0) console.log(`  ...${fatti}`);
}
console.log(`\nconvertiti: ${fatti}`);
