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

const val = (campo) => {
  if (!campo || typeof campo !== "object" || Array.isArray(campo))
    return campo ?? null;
  return LOCALE in campo ? (campo[LOCALE] ?? null) : campo;
};
const testo = (v) => String(v ?? "").trim();
const elenco = (campo) => {
  const v = val(campo) ?? campo;
  return Array.isArray(v) ? v : [];
};

const attesa = (ms) => new Promise((r) => setTimeout(r, ms));

async function conRitentativi(etichetta, azione) {
  for (let tentativo = 1; ; tentativo += 1) {
    try {
      return await azione();
    } catch (errore) {
      const messaggio = String(errore?.message ?? errore);
      const recuperabile =
        /ETIMEDOUT|ECONNRESET|socket hang up|HTTP2|502|503|504/i.test(
          messaggio,
        );
      if (!recuperabile || tentativo >= 4) throw errore;
      console.log(`   ritento ${etichetta} (${tentativo})`);
      await attesa(tentativo * 3000);
    }
  }
}

const SLUG_DIVERSI = {
  "app-io-cittadinanza-digitale": "app-io",
  "pagamenti-digitali-pagopa": "pagopa",
};

const tipiSorgente = await from.itemTypes.list();
const tipiTarget = await to.itemTypes.list();
const chiaveSorgente = Object.fromEntries(
  tipiSorgente.map((t) => [t.id, t.api_key]),
);
const idSorgente = (key) => tipiSorgente.find((t) => t.api_key === key)?.id;
const idTarget = (key) => tipiTarget.find((t) => t.api_key === key).id;

const tagPerSlug = new Map();
for await (const t of to.items.listPagedIterator({
  filter: { type: idTarget("tag") },
  version: "current",
})) {
  tagPerSlug.set(val(t.slug) ?? t.slug, t.id);
}

const articoliPerSlug = new Map();
for await (const a of to.items.listPagedIterator({
  filter: { type: idTarget("article") },
  version: "current",
})) {
  articoliPerSlug.set(val(a.slug), a);
}

const tagCreati = new Set();
async function tagTarget(idTagSorgente) {
  const sorgente = await from.items.find(idTagSorgente, { version: "current" });
  const slug = testo(val(sorgente.slug) ?? sorgente.slug);
  if (!slug) return null;
  if (tagPerSlug.has(slug)) return tagPerSlug.get(slug);
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
  tagPerSlug.set(slug, creato.id);
  return creato.id;
}

async function creaAllegato(sorgenteAllegato) {
  const upload = val(sorgenteAllegato.file)?.upload_id;
  if (!upload) return null;
  const titolo = testo(val(sorgenteAllegato.file_title)) || "Allegato";
  if (!COMMIT) return { titolo };
  const origine = await from.uploads.find(upload);
  const copiato = await conRitentativi(`upload ${origine.filename}`, () =>
    to.uploads.createFromUrl({
      url: origine.url,
      filename: origine.filename,
      skipCreationIfAlreadyExists: true,
    }),
  );
  const creato = await to.items.create({
    item_type: { type: "item_type", id: idTarget("attachment") },
    file_title: titolo,
    file_description: testo(val(sorgenteAllegato.file_description)),
    file: { upload_id: copiato.id },
  });
  await to.items.publish(creato.id);
  return { id: creato.id, titolo };
}

async function creaCollegamento(sorgenteLink) {
  const url = testo(val(sorgenteLink.link));
  if (!url || !/^https?:\/\//i.test(url)) return null;
  const titolo =
    testo(val(sorgenteLink.title)) || testo(val(sorgenteLink.cta_label)) || url;
  if (!COMMIT) return { titolo, url };
  const creato = await to.items.create({
    item_type: { type: "item_type", id: idTarget("link_external") },
    title: titolo,
    description: testo(val(sorgenteLink.description)),
    link: url,
    cta_label: testo(val(sorgenteLink.cta_label)),
  });
  await to.items.publish(creato.id);
  return { id: creato.id, titolo, url };
}

const interniDaRecuperare = [];
let totaleAllegati = 0;
let totaleLink = 0;

for await (const progetto of from.items.listPagedIterator({
  filter: { type: idSorgente("project") },
  version: "current",
})) {
  const slug = val(progetto.slug);
  const slugTarget = SLUG_DIVERSI[slug] ?? slug;
  const articolo = articoliPerSlug.get(slugTarget);
  if (!articolo) {
    console.log(`${slug.padEnd(46)} nessun articolo corrispondente`);
    continue;
  }

  const allegatiAttuali = elenco(articolo.attachments);
  const titoliAttuali = new Set();
  for (const idAllegato of allegatiAttuali) {
    const a = await to.items.find(idAllegato, { version: "current" });
    titoliAttuali.add(testo(val(a.file_title)));
  }

  const nuoviAllegati = [...allegatiAttuali];
  const aggiuntiAllegati = [];
  for (const idAllegato of elenco(progetto.attachments)) {
    const sorgenteAllegato = await from.items.find(idAllegato, {
      version: "current",
    });
    const titolo = testo(val(sorgenteAllegato.file_title)) || "Allegato";
    if (titoliAttuali.has(titolo)) continue;
    const creato = await creaAllegato(sorgenteAllegato);
    if (!creato) continue;
    aggiuntiAllegati.push(creato.titolo);
    if (creato.id) nuoviAllegati.push(creato.id);
  }

  const collegamentiAttuali = elenco(articolo.links);
  const urlAttuali = new Set();
  for (const idLink of collegamentiAttuali) {
    const l = await to.items.find(idLink, { version: "current" });
    urlAttuali.add(testo(val(l.link)));
  }

  const nuoviCollegamenti = [...collegamentiAttuali];
  const aggiuntiCollegamenti = [];
  const sorgentiLink = [
    ...elenco(progetto.links),
    ...elenco(progetto.links_external_project_card),
    val(progetto.link_external_project_website),
  ].filter(Boolean);

  for (const idLink of sorgentiLink) {
    const sorgenteLink = await from.items.find(idLink, { version: "current" });
    const tipo = chiaveSorgente[sorgenteLink.item_type.id];
    if (tipo === "link_internal") {
      const destinazione = sorgenteLink.link
        ? await from.items
            .find(sorgenteLink.link, { version: "current" })
            .catch(() => null)
        : null;
      interniDaRecuperare.push(
        `${slugTarget}: ${testo(val(sorgenteLink.title))} → ${destinazione ? `${chiaveSorgente[destinazione.item_type.id]} /${val(destinazione.slug)}` : "non risolto"}`,
      );
      continue;
    }
    const url = testo(val(sorgenteLink.link));
    if (urlAttuali.has(url)) continue;
    const creato = await creaCollegamento(sorgenteLink);
    if (!creato) continue;
    urlAttuali.add(creato.url);
    aggiuntiCollegamenti.push(creato.titolo);
    if (creato.id) nuoviCollegamenti.push(creato.id);
  }

  const argomentiAttuali = elenco(articolo.tags);
  const nuoviArgomenti = [...argomentiAttuali];
  for (const idTag of elenco(progetto.tags)) {
    const id = await tagTarget(idTag);
    if (id && !nuoviArgomenti.includes(id)) nuoviArgomenti.push(id);
  }

  totaleAllegati += aggiuntiAllegati.length;
  totaleLink += aggiuntiCollegamenti.length;
  const argomentiAggiunti = nuoviArgomenti.length - argomentiAttuali.length;

  if (
    !aggiuntiAllegati.length &&
    !aggiuntiCollegamenti.length &&
    !argomentiAggiunti
  ) {
    console.log(`${slugTarget.padEnd(46)} già completo`);
    continue;
  }
  console.log(
    `${slugTarget.padEnd(46)} allegati +${aggiuntiAllegati.length} | collegamenti +${aggiuntiCollegamenti.length} | argomenti +${argomentiAggiunti}`,
  );

  if (!COMMIT) continue;
  await to.items.update(articolo.id, {
    attachments: nuoviAllegati,
    links: nuoviCollegamenti,
    tags: nuoviArgomenti,
  });
  if (articolo.meta.status === "published") await to.items.publish(articolo.id);
}

console.log(`\ntotale: ${totaleAllegati} allegati, ${totaleLink} collegamenti`);
if (tagCreati.size) console.log("argomenti creati:", [...tagCreati].join(", "));
if (interniDaRecuperare.length) {
  console.log("\nlink interni che puntano a contenuti non ancora importati:");
  for (const riga of interniDaRecuperare) console.log(`  - ${riga}`);
}
if (!COMMIT) console.log("\nanteprima: nessuna scrittura");
