import { buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const TARGET_ENV = "website-astro-2026";
const LOCALE = "it";
const COMMIT = process.argv.includes("--commit");

const from = buildClient({
  apiToken: process.env.DATOCMS_FROM_IMPORT,
  requestTimeout: 120000,
});
const to = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: TARGET_ENV,
  requestTimeout: 120000,
});

const val = (campo) =>
  campo && typeof campo === "object" && !Array.isArray(campo)
    ? (campo[LOCALE] ?? null)
    : (campo ?? null);
const testo = (v) => String(v ?? "").trim();
const soloData = (v) => (testo(v) ? testo(v).slice(0, 10) : null);

const oggi = () => new Date().toISOString().slice(0, 10);

/**
 * Nel vecchio CMS restano posizioni con lo stato "aperto" e il bando scaduto da
 * anni: il sito in produzione le mostra chiuse, e così le importiamo.
 */
const statoEffettivo = (stato, dataChiusura) =>
  stato === "open" && (!dataChiusura || dataChiusura < oggi())
    ? "closed"
    : stato;

const STATO_PER_NOME = {
  APERTO: "open",
  CHIUSO: "closed",
  ESITI: "results",
  RITIRATO: "withdrawn",
  SCADUTO: "expired",
  SOSPESO: "suspended",
};

const tipiSorgente = await from.itemTypes.list();
const tipiTarget = await to.itemTypes.list();
const idSorgente = (key) => tipiSorgente.find((t) => t.api_key === key)?.id;
const idTarget = (key) => tipiTarget.find((t) => t.api_key === key).id;

const statiPerId = new Map();
for await (const s of from.items.listPagedIterator({
  filter: { type: idSorgente("announcements_state") },
  version: "current",
})) {
  statiPerId.set(s.id, testo(val(s.name) ?? s.name).toUpperCase());
}

const tagTargetPerSlug = new Map();
for await (const t of to.items.listPagedIterator({
  filter: { type: idTarget("tag") },
  version: "current",
})) {
  tagTargetPerSlug.set(val(t.slug) ?? t.slug, t.id);
}

const cacheSorgente = new Map();
const recordSorgente = async (id) => {
  if (!cacheSorgente.has(id))
    cacheSorgente.set(id, await from.items.find(id, { version: "current" }));
  return cacheSorgente.get(id);
};

const tagCreati = new Set();
async function tagTarget(idTagSorgente) {
  const sorgente = await recordSorgente(idTagSorgente);
  const slug = testo(val(sorgente.slug) ?? sorgente.slug);
  if (!slug) return null;
  if (tagTargetPerSlug.has(slug)) return tagTargetPerSlug.get(slug);
  const nome =
    testo(val(sorgente.name) ?? sorgente.name) ||
    testo(val(sorgente.title)) ||
    slug;
  tagCreati.add(`${slug} (${nome})`);
  if (!COMMIT) return null;
  const creato = await to.items.create({
    item_type: { type: "item_type", id: idTarget("tag") },
    name: nome,
    slug,
    description: "",
    is_category: false,
  });
  await to.items.publish(creato.id);
  tagTargetPerSlug.set(slug, creato.id);
  return creato.id;
}

const posizioniTarget = new Map();
for await (const r of to.items.listPagedIterator({
  filter: { type: idTarget("job_position") },
  version: "current",
})) {
  posizioniTarget.set(val(r.slug), r);
}

const posizioniSorgente = [];
for await (const p of from.items.listPagedIterator({
  filter: { type: idSorgente("work_position") },
  version: "current",
})) {
  posizioniSorgente.push(p);
}

console.log(
  `sorgente ${posizioniSorgente.length} | sandbox ${posizioniTarget.size}\n`,
);

let aggiornate = 0,
  invariate = 0,
  mancanti = 0;
const perStato = {};

for (const sorgente of posizioniSorgente) {
  const slug = val(sorgente.slug);
  const target = posizioniTarget.get(slug);
  if (!target) {
    mancanti += 1;
    console.log(`${slug.slice(0, 50).padEnd(52)} MANCANTE nel sandbox`);
    continue;
  }

  const nomeStato = statiPerId.get(val(sorgente.announcement_status)) ?? "";
  const stato = statoEffettivo(
    STATO_PER_NOME[nomeStato] ?? "closed",
    soloData(val(sorgente.announcement_date_closing)),
  );
  perStato[stato] = (perStato[stato] ?? 0) + 1;

  const argomenti = [];
  for (const idTag of sorgente.tags ?? []) {
    const id = await tagTarget(idTag);
    if (id) argomenti.push(id);
  }

  const ufficio = val(sorgente.office_link)
    ? testo(val((await recordSorgente(val(sorgente.office_link))).title))
    : "";
  const struttura = ufficio || testo(val(sorgente.announcement_owner));

  const attributi = {
    position_status: stato,
    topics: { [LOCALE]: argomenti },
    office: { [LOCALE]: struttura },
    sort_date: soloData(val(sorgente.date_shown)),
    show_sidebar: Boolean(val(sorgente.content_has_index)),
    close_date: soloData(val(sorgente.announcement_date_closing)),
    open_date: soloData(val(sorgente.announcement_date_opening)),
  };

  const invariato =
    target.position_status === attributi.position_status &&
    JSON.stringify(val(target.topics) ?? []) === JSON.stringify(argomenti) &&
    testo(val(target.office)) === struttura &&
    target.sort_date === attributi.sort_date &&
    Boolean(target.show_sidebar) === attributi.show_sidebar;

  if (invariato) {
    invariate += 1;
    continue;
  }

  console.log(
    `${slug.slice(0, 50).padEnd(52)} ${stato.padEnd(10)} argomenti ${String(argomenti.length).padEnd(2)} ${struttura.slice(0, 30)}`,
  );
  aggiornate += 1;
  if (!COMMIT) continue;

  await to.items.update(target.id, attributi);
  await to.items.publish(target.id);
}

console.log(
  `\nda aggiornare ${aggiornate} | già a posto ${invariate} | mancanti ${mancanti}`,
);
console.log("stati:", JSON.stringify(perStato));
if (tagCreati.size) console.log("tag creati:", [...tagCreati].join(", "));
if (!COMMIT) console.log("\nanteprima: nessuna scrittura");
