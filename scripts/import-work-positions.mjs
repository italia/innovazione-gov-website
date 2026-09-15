import { buildBlockRecord, buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";
import { headingNode, markdownToDastNodes } from "./lib/markdown-to-dast.mjs";

dotenv.config({ path: ".env" });

const TARGET_ENV = "website-astro-2026";
const LOCALE = "it";
const ARCHIVIO = "YKKtaMuaSkSL4LW0JMzvHg";
const COMMIT = process.argv.includes("--commit");
const ONLY_MISSING = process.argv.includes("--only-missing");
const indiceLimite = process.argv.indexOf("--limit");
const LIMITE =
  indiceLimite > -1 ? Number(process.argv[indiceLimite + 1]) : Infinity;

const from = buildClient({
  apiToken: process.env.DATOCMS_FROM_IMPORT,
  requestTimeout: 120000,
});
const to = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: TARGET_ENV,
  requestTimeout: 120000,
});

const attesa = (ms) => new Promise((r) => setTimeout(r, ms));

async function conRitentativi(etichetta, azione) {
  for (let tentativo = 1; ; tentativo += 1) {
    try {
      return await azione();
    } catch (errore) {
      const recuperabile =
        /ETIMEDOUT|ECONNRESET|socket hang up|502|503|504/i.test(
          String(errore?.message ?? errore),
        );
      if (!recuperabile || tentativo >= 4) throw errore;
      console.log(`   ritento ${etichetta} (${tentativo})`);
      await attesa(tentativo * 3000);
    }
  }
}

const valore = (campo) =>
  campo && typeof campo === "object" && !Array.isArray(campo)
    ? (campo[LOCALE] ?? null)
    : (campo ?? null);
const testo = (v) => String(v ?? "").trim();
const tronca = (v, max) => {
  const s = testo(v);
  if (s.length <= max) return s;
  const tagliato = s.slice(0, max);
  const spazio = tagliato.lastIndexOf(" ");
  return (spazio > max * 0.6 ? tagliato.slice(0, spazio) : tagliato).trim();
};
const euro = (importo) =>
  typeof importo === "number" && importo > 0
    ? `${importo.toLocaleString("it-IT", { minimumFractionDigits: 2 })} €`
    : null;
const soloData = (v) => (testo(v) ? testo(v).slice(0, 10) : null);

const uploadPerSorgente = new Map();
async function copiaUpload(idSorgente) {
  if (uploadPerSorgente.has(idSorgente))
    return uploadPerSorgente.get(idSorgente);
  const sorgente = await from.uploads.find(idSorgente);
  const creato = await conRitentativi(`upload ${sorgente.filename}`, () =>
    to.uploads.createFromUrl({
      url: sorgente.url,
      filename: sorgente.filename,
      skipCreationIfAlreadyExists: true,
    }),
  );
  uploadPerSorgente.set(idSorgente, creato.id);
  return creato.id;
}

const cacheSorgente = new Map();
async function recordSorgente(id) {
  if (!cacheSorgente.has(id))
    cacheSorgente.set(
      id,
      await from.items.find(id, { version: "current", nested: true }),
    );
  return cacheSorgente.get(id);
}

const tipiSorgente = await from.itemTypes.list();
const tipiTarget = await to.itemTypes.list();
const idSorgente = (key) => tipiSorgente.find((t) => t.api_key === key)?.id;
const idTarget = (key) => tipiTarget.find((t) => t.api_key === key).id;
const chiaveBloccoSorgente = Object.fromEntries(
  tipiSorgente.map((t) => [t.id, t.api_key]),
);
const blocco = (key, attributi) =>
  buildBlockRecord({
    item_type: { type: "item_type", id: idTarget(key) },
    ...attributi,
  });

const statiPerId = new Map();
for await (const s of from.items.listPagedIterator({
  filter: { type: idSorgente("announcements_state") },
  version: "current",
})) {
  statiPerId.set(
    s.id,
    testo(valore(s.title) ?? s.title ?? s.name).toUpperCase(),
  );
}

async function contenuto(posizione) {
  const nodi = [];
  const blocchi =
    valore(posizione.content_blocks) ?? posizione.content_blocks ?? [];
  for (const b of Array.isArray(blocchi) ? blocchi : []) {
    const kind = chiaveBloccoSorgente[b.relationships?.item_type?.data?.id];
    const attributi = b.attributes ?? b;
    if (kind !== "block_body_text") continue;
    const titolo = testo(attributi.text_title);
    if (titolo) nodi.push(headingNode(titolo, 3));
    nodi.push(...markdownToDastNodes(attributi.body_text));
  }

  for (const idAllegato of posizione.attachments ?? []) {
    const allegato = await recordSorgente(idAllegato);
    const upload = allegato.file?.upload_id;
    if (!upload) continue;
    nodi.push({
      type: "block",
      item: blocco("download_link", {
        label: testo(allegato.file_title) || "Allegato",
        description: testo(allegato.file_description),
        doc: { upload_id: await copiaUpload(upload) },
      }),
    });
  }

  const collegamenti = [];
  for (const idLink of posizione.links ?? []) {
    const link = await recordSorgente(idLink);
    if (!testo(link.link)) continue;
    collegamenti.push(
      blocco("external_link", {
        label: testo(link.title) || testo(link.cta_label) || testo(link.link),
        description: testo(link.description),
        url: testo(link.link),
      }),
    );
  }
  if (collegamenti.length) {
    nodi.push({
      type: "block",
      item: blocco("list_external_link", { links: collegamenti }),
    });
  }

  if (!nodi.length)
    nodi.push({
      type: "paragraph",
      children: [{ type: "span", value: "Da completare." }],
    });
  return nodi;
}

const esistentiPerSlug = new Map();
for await (const r of to.items.listPagedIterator({
  filter: { type: idTarget("job_position") },
  version: "current",
})) {
  esistentiPerSlug.set(valore(r.slug), r.id);
}

const posizioni = [];
for await (const p of from.items.listPagedIterator({
  filter: { type: idSorgente("work_position") },
  version: "current",
  nested: true,
  order_by: "date_shown_DESC",
})) {
  posizioni.push(p);
}
console.log(
  `posizioni in sorgente: ${posizioni.length} | già in sandbox: ${esistentiPerSlug.size}\n`,
);

let create = 0,
  saltate = 0,
  errori = 0;
for (const posizione of posizioni.slice(
  0,
  LIMITE === Infinity ? undefined : LIMITE,
)) {
  const slug = valore(posizione.slug);
  const titolo = testo(valore(posizione.title));
  if (esistentiPerSlug.has(slug)) {
    saltate += 1;
    if (!ONLY_MISSING)
      console.log(`${slug.slice(0, 52).padEnd(54)} già presente`);
    continue;
  }

  const stato =
    statiPerId.get(
      valore(posizione.announcement_status) ?? posizione.announcement_status,
    ) ?? "";
  const aperta = stato === "APERTO";
  const sottotitolo = testo(valore(posizione.subtitle));
  const seo = valore(posizione.seo) ?? {};

  console.log(
    `${slug.slice(0, 52).padEnd(54)} ${(stato || "-").padEnd(9)} ${aperta ? "open" : "closed"}`,
  );
  if (!COMMIT) continue;

  try {
    const nodi = await contenuto(posizione);
    const payload = {
      item_type: { type: "item_type", id: idTarget("job_position") },
      title: { [LOCALE]: titolo },
      slug: { [LOCALE]: slug },
      parent_page: { [LOCALE]: ARCHIVIO },
      position_status: aperta ? "open" : "closed",
      open_date: soloData(valore(posizione.announcement_date_opening)),
      close_date: soloData(valore(posizione.announcement_date_closing)),
      compensation: { [LOCALE]: euro(valore(posizione.fee)) ?? "" },
      abstract: { [LOCALE]: sottotitolo },
      seo: {
        [LOCALE]: {
          title: tronca(seo.title || titolo, 60),
          description: tronca(seo.description || sottotitolo, 160),
          image: null,
          no_index: false,
          twitter_card: null,
        },
      },
      content: {
        [LOCALE]: [
          blocco("hero", {
            variant: "default",
            background_color: "lighter",
            show_breadcrumb: true,
            title: titolo,
            paragraph: sottotitolo,
            background_image: null,
            background_image_for_mobile: null,
            cta: null,
          }),
          blocco("structured_text", {
            background_color: "default",
            font_serif: false,
            show_page_index: false,
            content: {
              schema: "dast",
              document: { type: "root", children: nodi },
            },
          }),
        ],
      },
    };
    const creato = await conRitentativi(slug, () => to.items.create(payload));
    if (posizione.meta.status === "published")
      await conRitentativi(`publish ${slug}`, () =>
        to.items.publish(creato.id),
      );
    esistentiPerSlug.set(slug, creato.id);
    create += 1;
  } catch (errore) {
    errori += 1;
    console.log(
      `   ERRORE: ${String(errore?.message ?? errore).slice(0, 160)}`,
    );
  }
}

console.log(
  COMMIT
    ? `\ncreate: ${create} | già presenti: ${saltate} | errori: ${errori}`
    : "\n--- anteprima, nessuna scrittura ---",
);
