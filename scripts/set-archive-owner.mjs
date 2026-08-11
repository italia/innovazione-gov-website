/**
 * Imposta filter_owner = "Sottosegretario" sul catalogue_tab dei 4 archivi
 * index_page del Sottosegretario, così gli archivi sono scopati per figura
 * (usa il filtro owner aggiunto in Fase D). Idempotente.
 *
 * Uso: node scripts/set-archive-owner.mjs [--commit]
 */
import { buildClient } from "@datocms/cma-client";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const COMMIT = process.argv.includes("--commit");
const ENV = "website-astro-2026";
const OWNER_LABEL = "Sottosegretario";
const ARCHIVES = ["notizie", "interviste", "interventi", "comunicati-stampa"];

const to = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: ENV,
  requestTimeout: 60000,
});
const val = (f, l) =>
  f == null ? "" : typeof f === "object" ? (f[l] ?? "") : l === "it" ? f : "";

const its = await to.itemTypes.list();
const byId = Object.fromEntries(its.map((i) => [i.id, i.api_key]));
const IP = its.find((i) => i.api_key === "index_page").id;
const OWNER = its.find((i) => i.api_key === "owner").id;

// id del valore owner "Sottosegretario"
let ownerId = null;
for await (const o of to.items.listPagedIterator({
  filter: { type: OWNER },
  version: "current",
  perPage: 100,
})) {
  if (val(o.label, "it") === OWNER_LABEL) ownerId = o.id;
}
if (!ownerId) {
  console.error(`Owner "${OWNER_LABEL}" non trovato`);
  process.exit(1);
}
console.log(
  `Owner "${OWNER_LABEL}" id: ${ownerId}  [${COMMIT ? "COMMIT" : "DRY-RUN"}]`,
);

// ricostruisce un blocco preservando id/relationships, settando filter_owner sul catalogue_tab
function rebuild(b) {
  const key = byId[b.relationships.item_type.data.id];
  const attributes = { ...b.attributes };
  if (key === "catalogue_feed")
    attributes.tabs = (b.attributes.tabs || []).map(rebuild);
  if (key === "catalogue_tab") attributes.filter_owner = ownerId;
  return { type: "item", id: b.id, attributes, relationships: b.relationships };
}

for await (const p of to.items.listPagedIterator({
  filter: { type: IP },
  version: "current",
  nested: true,
  perPage: 50,
})) {
  const slug = val(p.slug, "it");
  if (!ARCHIVES.includes(slug)) continue;
  const content = {};
  for (const locale of Object.keys(p.content)) {
    content[locale] = (p.content[locale] || []).map(rebuild);
  }
  console.log(
    `  ${COMMIT ? "set" : "[dry] setterei"} filter_owner su archivio "${slug}"`,
  );
  if (COMMIT) {
    await to.items.update(p.id, { content });
    await to.items.publish(p.id);
  }
}
console.log(COMMIT ? "FATTO" : "(dry) rilancia con --commit");
