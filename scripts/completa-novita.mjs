import { buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const TARGET_ENV = "website-astro-2026";
const LOCALE = "it";
const COMMIT = process.argv.includes("--commit");
const indiceModelli = process.argv.indexOf("--modelli");
const MODELLI =
  indiceModelli > -1
    ? process.argv[indiceModelli + 1].split(",")
    : ["article", "press_release", "interview", "focus_page"];

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
        /ETIMEDOUT|ECONNRESET|EHOSTUNREACH|ENETUNREACH|socket hang up|fetch failed|UND_ERR|HTTP2|502|503|504|429/i.test(
          messaggio,
        );
      if (!recuperabile || tentativo >= 5) throw errore;
      await attesa(tentativo * 2500);
    }
  }
}

const tipiSorgente = await from.itemTypes.list();
const tipiTarget = await to.itemTypes.list();
const chiaveSorgente = Object.fromEntries(
  tipiSorgente.map((t) => [t.id, t.api_key]),
);
const idSorgente = (key) => tipiSorgente.find((t) => t.api_key === key)?.id;
const idTarget = (key) => tipiTarget.find((t) => t.api_key === key).id;

const articoli = new Map();
for await (const a of to.items.listPagedIterator({
  filter: { type: idTarget("article") },
  version: "current",
})) {
  articoli.set(val(a.slug), a);
}

const cacheSorgente = new Map();
async function sorgentePerId(id) {
  if (!cacheSorgente.has(id))
    cacheSorgente.set(id, await from.items.find(id, { version: "current" }));
  return cacheSorgente.get(id);
}

async function creaAllegato(sorgenteAllegato) {
  const upload = val(sorgenteAllegato.file)?.upload_id;
  if (!upload) return null;
  const titolo = testo(val(sorgenteAllegato.file_title)) || "Allegato";
  if (!COMMIT) return { titolo };
  const origine = await conRitentativi("upload", () =>
    from.uploads.find(upload),
  );
  const copiato = await conRitentativi(`copia ${origine.filename}`, () =>
    to.uploads.createFromUrl({
      url: origine.url,
      filename: origine.filename,
      skipCreationIfAlreadyExists: true,
    }),
  );
  const creato = await conRitentativi("allegato", () =>
    to.items.create({
      item_type: { type: "item_type", id: idTarget("attachment") },
      file_title: titolo,
      file_description: testo(val(sorgenteAllegato.file_description)),
      file: { upload_id: copiato.id },
    }),
  );
  await to.items.publish(creato.id);
  return { id: creato.id, titolo };
}

async function creaCollegamento(sorgenteLink) {
  const url = testo(val(sorgenteLink.link));
  if (!url || !/^https?:\/\//i.test(url)) return null;
  const titolo =
    testo(val(sorgenteLink.title)) || testo(val(sorgenteLink.cta_label)) || url;
  if (!COMMIT) return { titolo, url };
  const creato = await conRitentativi("collegamento", () =>
    to.items.create({
      item_type: { type: "item_type", id: idTarget("link_external") },
      title: titolo,
      description: testo(val(sorgenteLink.description)),
      link: url,
      cta_label: testo(val(sorgenteLink.cta_label)),
    }),
  );
  await to.items.publish(creato.id);
  return { id: creato.id, titolo, url };
}

let allegatiAggiunti = 0;
let collegamentiAggiunti = 0;
let interni = 0;
let toccati = 0;
let esaminati = 0;

for (const modello of MODELLI) {
  for await (const sorgente of from.items.listPagedIterator({
    filter: { type: idSorgente(modello) },
    version: "current",
  })) {
    esaminati += 1;
    const slug = val(sorgente.slug);
    const articolo = articoli.get(slug);
    if (!articolo) continue;

    const allegatiSorgente = elenco(sorgente.attachments);
    const linkSorgente = elenco(sorgente.links);
    if (!allegatiSorgente.length && !linkSorgente.length) continue;

    const allegatiAttuali = elenco(articolo.attachments);
    const titoliAttuali = new Set();
    for (const idAllegato of allegatiAttuali) {
      const a = await to.items.find(idAllegato, { version: "current" });
      titoliAttuali.add(testo(val(a.file_title)));
    }

    const nuoviAllegati = [...allegatiAttuali];
    let aggiuntiQui = 0;
    for (const idAllegato of allegatiSorgente) {
      const sorgenteAllegato = await sorgentePerId(idAllegato);
      const titolo = testo(val(sorgenteAllegato.file_title)) || "Allegato";
      if (titoliAttuali.has(titolo)) continue;
      const creato = await creaAllegato(sorgenteAllegato);
      if (!creato) continue;
      titoliAttuali.add(creato.titolo);
      aggiuntiQui += 1;
      if (creato.id) nuoviAllegati.push(creato.id);
    }

    const collegamentiAttuali = elenco(articolo.links);
    const urlAttuali = new Set();
    for (const idLink of collegamentiAttuali) {
      const l = await to.items.find(idLink, { version: "current" });
      urlAttuali.add(testo(val(l.link)));
    }

    const nuoviCollegamenti = [...collegamentiAttuali];
    let collegamentiQui = 0;
    for (const idLink of linkSorgente) {
      const sorgenteLink = await sorgentePerId(idLink);
      if (chiaveSorgente[sorgenteLink.item_type.id] === "link_internal") {
        interni += 1;
        continue;
      }
      const url = testo(val(sorgenteLink.link));
      if (!url || urlAttuali.has(url)) continue;
      const creato = await creaCollegamento(sorgenteLink);
      if (!creato) continue;
      urlAttuali.add(creato.url);
      collegamentiQui += 1;
      if (creato.id) nuoviCollegamenti.push(creato.id);
    }

    if (!aggiuntiQui && !collegamentiQui) continue;
    allegatiAggiunti += aggiuntiQui;
    collegamentiAggiunti += collegamentiQui;
    toccati += 1;
    if (toccati % 25 === 0)
      console.log(
        `   ${toccati} record aggiornati (${allegatiAggiunti} allegati, ${collegamentiAggiunti} collegamenti)`,
      );

    if (!COMMIT) continue;
    await conRitentativi(`aggiorna ${slug}`, () =>
      to.items.update(articolo.id, {
        attachments: nuoviAllegati,
        links: nuoviCollegamenti,
      }),
    );
    if (articolo.meta.status === "published")
      await to.items.publish(articolo.id);
  }
  console.log(`${modello}: esaminati ${esaminati}, aggiornati ${toccati}`);
}

console.log(
  `\ntotale: ${allegatiAggiunti} allegati, ${collegamentiAggiunti} collegamenti su ${toccati} record`,
);
console.log(
  `link interni saltati (puntano a record del vecchio CMS): ${interni}`,
);
if (!COMMIT) console.log("\nanteprima: nessuna scrittura");
