import { buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const COMMIT = process.argv.includes("--commit");
const TARGET_ENV = "website-astro-2026";
const MODELLI_CHE_COLLEGANO = ["article", "insight"];

const to = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: TARGET_ENV,
  requestTimeout: 60000,
});

const tipi = await to.itemTypes.list();
const idDi = (apiKey) => tipi.find((t) => t.api_key === apiKey)?.id;

const elenca = async (type) => {
  const items = [];
  for await (const r of to.items.listPagedIterator({
    filter: { type },
    version: "current",
  }))
    items.push(r);
  return items;
};

const fileDi = (r) =>
  r.file && typeof r.file === "object" && "upload_id" in r.file
    ? r.file
    : (r.file?.it ?? null);
const titoloDi = (r) =>
  String(
    (typeof r.file_title === "object" && r.file_title
      ? r.file_title.it
      : r.file_title) ?? "",
  ).trim();

const allegati = await elenca(idDi("attachment"));

const collegati = new Set();
for (const apiKey of MODELLI_CHE_COLLEGANO)
  for (const r of await elenca(idDi(apiKey)))
    for (const id of r.attachments ?? []) collegati.add(id);

const gruppi = new Map();
for (const r of allegati) {
  const chiave = `${fileDi(r)?.upload_id ?? "-"}|${titoloDi(r)}`;
  if (!gruppi.has(chiave)) gruppi.set(chiave, []);
  gruppi.get(chiave).push(r);
}

const daEliminare = [];
for (const [, copie] of gruppi) {
  if (copie.length < 2) continue;
  const scollegate = copie.filter((r) => !collegati.has(r.id));
  const quanteRestano = copie.length - scollegate.length;
  const tenerneUna = quanteRestano === 0 ? 1 : 0;
  daEliminare.push(...scollegate.slice(tenerneUna));
}

console.log(COMMIT ? `scritture su ${TARGET_ENV}` : "DRY-RUN (usa --commit)");
console.log(`record allegato: ${allegati.length}`);
console.log(`collegati da articoli o sottopagine: ${collegati.size}`);
console.log(`duplicati scollegati da eliminare: ${daEliminare.length}`);

if (!COMMIT) {
  for (const r of daEliminare.slice(0, 5))
    console.log(`   [dry] ${titoloDi(r).slice(0, 60)}`);
  process.exit(0);
}

let eliminati = 0;
for (const r of daEliminare) {
  const riferimenti = await to.items.references(r.id, { version: "current" });
  if (riferimenti.length) {
    console.log(
      `saltato, ha ${riferimenti.length} riferimenti: ${titoloDi(r)}`,
    );
    continue;
  }
  await to.items.destroy(r.id);
  eliminati += 1;
}
console.log(`eliminati: ${eliminati}`);
