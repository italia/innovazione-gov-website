import { buildClient } from "@datocms/cma-client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const COMMIT = process.argv.includes("--commit");
const TARGET_ENV = "website-astro-2026";
const UNDERSECRETARY_OWNER_ID = "56031174";

const TIPI_RICHIESTI = process.argv
  .filter((arg) => arg.startsWith("--tipo="))
  .map((arg) => arg.slice("--tipo=".length));

const MODELLO_SORGENTE_PER_TIPO = {
  news: "article",
  press_release: "press_release",
  interview: "interview",
  participation: "participation",
};

const tipiDaAllineare = TIPI_RICHIESTI.length
  ? TIPI_RICHIESTI
  : Object.keys(MODELLO_SORGENTE_PER_TIPO);

const from = buildClient({
  apiToken: process.env.DATOCMS_FROM_IMPORT,
  requestTimeout: 60000,
});
const to = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: TARGET_ENV,
  requestTimeout: 60000,
});

const slugDi = (record) =>
  record.slug && typeof record.slug === "object"
    ? (record.slug.it ?? "")
    : (record.slug ?? "");

async function elenca(client, filter) {
  const items = [];
  for await (const item of client.items.listPagedIterator({
    filter,
    version: "current",
  }))
    items.push(item);
  return items;
}

console.log(
  COMMIT
    ? `allineamento flag -> ${TARGET_ENV} (scritture attive)`
    : `DRY-RUN flag -> ${TARGET_ENV} (usa --commit per scrivere)`,
);
console.log(`tipi: ${tipiDaAllineare.join(", ")}\n`);

const tipiSorgente = await from.itemTypes.list();
const modelloArticolo = (await to.itemTypes.list()).find(
  (tipo) => tipo.api_key === "article",
);
const articoli = await elenca(to, { type: modelloArticolo.id });

for (const tipo of tipiDaAllineare) {
  const apiKeySorgente = MODELLO_SORGENTE_PER_TIPO[tipo];
  const modelloSorgente = tipiSorgente.find(
    (t) => t.api_key === apiKeySorgente,
  );
  const esclusivi = new Set();
  for (const record of await elenca(from, { type: modelloSorgente.id })) {
    const owners = record.owners ?? [];
    if (owners.length === 1 && owners[0] === UNDERSECRETARY_OWNER_ID)
      esclusivi.add(slugDi(record));
  }

  const delTipo = articoli.filter((a) => a.article_type === tipo);
  const daAccendere = delTipo.filter(
    (a) => !a.undersecretary && esclusivi.has(slugDi(a)),
  );
  const daSpegnere = delTipo.filter(
    (a) => a.undersecretary && !esclusivi.has(slugDi(a)),
  );

  console.log(
    `${tipo}: ${delTipo.length} articoli, ${delTipo.filter((a) => a.undersecretary).length} marcati oggi, ${esclusivi.size} di proprietà esclusiva nel vecchio CMS`,
  );
  console.log(
    `  da accendere: ${daAccendere.length}  da spegnere: ${daSpegnere.length}`,
  );

  for (const articolo of [...daAccendere, ...daSpegnere]) {
    const acceso = esclusivi.has(slugDi(articolo));
    console.log(
      `  ${COMMIT ? "scritto" : "[dry]"} ${acceso ? "ON " : "OFF"} ${slugDi(articolo)}`,
    );
    if (!COMMIT) continue;
    await to.items.update(articolo.id, { undersecretary: acceso });
    if (articolo.meta.status !== "draft") await to.items.publish(articolo.id);
  }
  console.log("");
}
