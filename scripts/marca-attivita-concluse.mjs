import { buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const COMMIT = process.argv.includes("--commit");
const ARCHIVIO = "BLhVSfscSeuE6BpfW9ljQA";

const client = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: "website-astro-2026",
  requestTimeout: 60000,
});

const tipi = await client.itemTypes.list();
const article = tipi.find((t) => t.api_key === "article").id;

const progetti = [];
for await (const r of client.items.listPagedIterator({
  filter: { type: article, fields: { article_type: { eq: "project" } } },
  version: "current",
}))
  progetti.push(r);

const conclusi = progetti.filter(
  (r) => (r.parent_page?.it ?? r.parent_page) === ARCHIVIO,
);
console.log(
  `progetti: ${progetti.length}, da marcare conclusi: ${conclusi.length}`,
);
for (const r of conclusi) console.log("  conclusa:", r.title?.it ?? r.title);

if (!COMMIT) {
  console.log("DRY-RUN (usa --commit)");
  process.exit(0);
}

for (const r of progetti) {
  const concluso = conclusi.includes(r);
  if (r.archived === concluso) continue;
  await client.items.update(r.id, { archived: concluso });
  if (r.meta.status === "published") await client.items.publish(r.id);
  console.log(
    `${concluso ? "conclusa" : "in corso"}: ${r.title?.it ?? r.title}`,
  );
}
console.log("fatto");
