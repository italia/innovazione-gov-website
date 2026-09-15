import { buildBlockRecord, buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";
import { headingNode, markdownToDastNodes } from "./lib/markdown-to-dast.mjs";

dotenv.config({ path: ".env" });

const TARGET_ENV = "website-astro-2026";
const LOCALE = "it";
const COMMIT = process.argv.includes("--commit");
const indiceRicostruisci = process.argv.indexOf("--rebuild");
const DA_RICOSTRUIRE =
  indiceRicostruisci > -1
    ? (process.argv[indiceRicostruisci + 1] ?? "").split(",").filter(Boolean)
    : [];

const from = buildClient({
  apiToken: process.env.DATOCMS_FROM_IMPORT,
  requestTimeout: 120000,
});
const to = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: TARGET_ENV,
  requestTimeout: 120000,
});

const IMMAGINE_DI_SCORTA = "ZxJioUtzTUK_lVvA0mFG8g";

const attesa = (ms) => new Promise((r) => setTimeout(r, ms));
async function conRitentativi(etichetta, azione) {
  for (let tentativo = 1; ; tentativo += 1) {
    try {
      return await azione();
    } catch (errore) {
      const recuperabile = /ETIMEDOUT|ECONNRESET|socket hang up|50[234]/i.test(
        String(errore?.message ?? errore),
      );
      if (!recuperabile || tentativo >= 4) throw errore;
      console.log(`   ritento ${etichetta} (${tentativo})`);
      await attesa(tentativo * 3000);
    }
  }
}

const val = (campo) => {
  if (!campo || typeof campo !== "object" || Array.isArray(campo))
    return campo ?? null;
  return LOCALE in campo ? (campo[LOCALE] ?? null) : campo;
};
const testo = (v) => String(v ?? "").trim();
const tronca = (v, max) => {
  const s = testo(v);
  if (s.length <= max) return s;
  const tagliato = s.slice(0, max);
  const spazio = tagliato.lastIndexOf(" ");
  return (spazio > max * 0.6 ? tagliato.slice(0, spazio) : tagliato).trim();
};

const tipiSorgente = await from.itemTypes.list();
const tipiTarget = await to.itemTypes.list();
const chiaveSorgente = Object.fromEntries(
  tipiSorgente.map((t) => [t.id, t.api_key]),
);
const idSorgente = (key) => tipiSorgente.find((t) => t.api_key === key)?.id;
const idTarget = (key) => {
  const t = tipiTarget.find((x) => x.api_key === key);
  if (!t) throw new Error(`modello target mancante: ${key}`);
  return t.id;
};
const blocco = (key, attributi) =>
  buildBlockRecord({
    item_type: { type: "item_type", id: idTarget(key) },
    ...attributi,
  });

const uploadPerSorgente = new Map();
async function copiaUpload(idUpload) {
  if (!idUpload) return null;
  if (uploadPerSorgente.has(idUpload)) return uploadPerSorgente.get(idUpload);
  const sorgente = await from.uploads.find(idUpload);
  if (!COMMIT) return "anteprima";
  const creato = await conRitentativi(`upload ${sorgente.filename}`, () =>
    to.uploads.createFromUrl({
      url: sorgente.url,
      filename: sorgente.filename,
      skipCreationIfAlreadyExists: true,
    }),
  );
  uploadPerSorgente.set(idUpload, creato.id);
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

const blocchiDi = (campo) => {
  const v = val(campo) ?? campo;
  return Array.isArray(v) ? v : [];
};
const tipoBlocco = (b) => chiaveSorgente[b.relationships?.item_type?.data?.id];

async function urlDelLink(idLink) {
  if (!idLink) return null;
  const link = await recordSorgente(idLink);
  const diretto = testo(val(link.link) ?? link.link);
  if (diretto) return diretto;
  return null;
}

async function nodiDaBlocchi(blocchi) {
  const nodi = [];
  for (const b of blocchi) {
    const kind = tipoBlocco(b);
    const a = b.attributes ?? b;

    if (kind === "block_body_text") {
      const titolo = testo(a.text_title);
      if (titolo) nodi.push(headingNode(titolo, 2));
      nodi.push(...markdownToDastNodes(a.body_text));
      continue;
    }

    if (kind === "block_image_single" && a.image?.upload_id) {
      const upload = await copiaUpload(a.image.upload_id);
      if (upload && COMMIT) {
        nodi.push({
          type: "block",
          item: blocco("image_block", {
            image: { upload_id: upload },
            ratio: "16x9",
          }),
        });
      }
      continue;
    }

    if (kind === "block_cta") {
      for (const idCta of a.cta_items ?? []) {
        const cta = await recordSorgente(idCta);
        const url = testo(val(cta.link) ?? cta.link);
        const etichetta =
          testo(val(cta.cta_label) ?? cta.cta_label) ||
          testo(val(cta.title) ?? cta.title);
        if (!url || !etichetta) continue;
        nodi.push({
          type: "block",
          item: blocco("external_link", {
            label: etichetta,
            url,
            description: testo(val(cta.description) ?? cta.description),
          }),
        });
      }
      continue;
    }
  }
  return nodi;
}

function sezioneTesto(nodi) {
  return blocco("structured_text", {
    background_color: "default",
    font_serif: false,
    show_page_index: false,
    content: { schema: "dast", document: { type: "root", children: nodi } },
  });
}

async function nodiAccordion(b) {
  const a = b.attributes ?? b;
  const voci = [];
  for (const idVoce of a.accordion_items ?? []) {
    const voce = await recordSorgente(idVoce);
    const intestazione = testo(
      val(voce.accordion_item_title) ?? val(voce.title) ?? voce.header,
    );
    const corpo = testo(
      val(voce.accordion_item_body_text) ?? val(voce.body) ?? val(voce.text),
    );
    if (!intestazione && !corpo) continue;
    voci.push(blocco("accordion_item", { header: intestazione, body: corpo }));
  }
  if (!voci.length) return [];
  return [
    {
      type: "block",
      item: blocco("accordion_block", {
        title: "",
        accordion: blocco("accordion", { items: voci }),
      }),
    },
  ];
}

async function nodiRisorse(sorgente) {
  const nodi = [];
  for (const idAllegato of sorgente.attachments ?? []) {
    const allegato = await recordSorgente(idAllegato);
    const upload = val(allegato.file)?.upload_id;
    if (!upload) continue;
    const copiato = await copiaUpload(upload);
    if (!copiato || !COMMIT) continue;
    nodi.push({
      type: "block",
      item: blocco("download_link", {
        label: testo(val(allegato.file_title)) || "Allegato",
        description: testo(val(allegato.file_description)),
        doc: { upload_id: copiato },
      }),
    });
  }

  const collegamenti = [];
  for (const idLink of sorgente.links ?? []) {
    const link = await recordSorgente(idLink);
    const url = testo(val(link.link));
    if (!url) continue;
    collegamenti.push(
      blocco("external_link", {
        label: testo(val(link.title)) || testo(val(link.cta_label)) || url,
        description: testo(val(link.description)),
        url,
      }),
    );
  }
  if (collegamenti.length) {
    nodi.push(headingNode("Collegamenti utili", 2));
    nodi.push({
      type: "block",
      item: blocco("list_external_link", { links: collegamenti }),
    });
  }
  return nodi;
}

const articoliTargetPerSlug = new Map();
for await (const a of to.items.listPagedIterator({
  filter: { type: idTarget("article") },
  version: "current",
})) {
  articoliTargetPerSlug.set(val(a.slug), a);
}

async function sezioneCorrelati(sorgente) {
  const carte = [];
  for (const idCorrelato of sorgente.related_items ?? []) {
    const correlato = await recordSorgente(idCorrelato);
    const target = articoliTargetPerSlug.get(val(correlato.slug));
    if (!target) continue;
    carte.push(
      blocco("card_link", {
        title: testo(val(target.title)),
        paragraph:
          testo(val(target.paragraph)) || testo(val(target.description)),
        image: {
          upload_id: val(target.image)?.upload_id ?? IMMAGINE_DI_SCORTA,
        },
        link: blocco("link_block", { link: target.id, external_url: "" }),
      }),
    );
  }
  if (!carte.length) return null;
  return blocco("card_link_list", {
    show_inline_card: false,
    background_color: "lighter",
    title: "Approfondisci",
    paragraph: "",
    list_content: carte,
    last_items: null,
    category: null,
    show_filter_on_category: false,
    cta: null,
  });
}

async function contenutoSottopagina(sorgente) {
  const sezioni = [];
  const titolo = testo(val(sorgente.title));
  const sottotitolo = testo(val(sorgente.subtitle));

  sezioni.push(
    blocco("hero", {
      variant: "small",
      background_color: "lighter",
      show_breadcrumb: true,
      title: titolo,
      paragraph: sottotitolo,
      background_image: null,
      background_image_for_mobile: null,
      cta: null,
    }),
  );

  const nodi = [];
  for (const b of blocchiDi(sorgente.content_blocks)) {
    if (tipoBlocco(b) === "block_accordion") {
      nodi.push(...(await nodiAccordion(b)));
      continue;
    }
    nodi.push(...(await nodiDaBlocchi([b])));
  }
  nodi.push(...(await nodiRisorse(sorgente)));
  if (nodi.length) sezioni.push(sezioneTesto(nodi));

  const correlati = await sezioneCorrelati(sorgente);
  if (correlati) sezioni.push(correlati);

  return sezioni;
}

const [paginaSorgente] = await from.items.list({
  filter: { type: idSorgente("italy2026_page") },
  version: "current",
  nested: true,
});

const sottopagineSorgente = [];
for await (const r of from.items.listPagedIterator({
  filter: { type: idSorgente("italy2026_subpage") },
  version: "current",
  nested: true,
})) {
  sottopagineSorgente.push(r);
}

console.log(
  `sorgente: pagina "${testo(val(paginaSorgente.title))}" + ${sottopagineSorgente.length} sottopagine\n`,
);

const esistentiPagine = new Map();
for await (const r of to.items.listPagedIterator({
  filter: { type: idTarget("page") },
  version: "current",
}))
  esistentiPagine.set(val(r.slug), r.id);
const esistentiInsight = new Map();
for await (const r of to.items.listPagedIterator({
  filter: { type: idTarget("insight") },
  version: "current",
}))
  esistentiInsight.set(val(r.slug), r.id);

const slugRadice = val(paginaSorgente.slug);
let idRadice = esistentiPagine.get(slugRadice) ?? null;
console.log(
  `pagina radice /${slugRadice}: ${idRadice ? "già presente" : "da creare"}`,
);
for (const s of sottopagineSorgente) {
  const slug = val(s.slug);
  console.log(
    `  ${slug.padEnd(34)} ${esistentiInsight.has(slug) ? "già presente" : "da creare"}  (${s.meta.status})`,
  );
}

if (!COMMIT) {
  console.log("\n--- anteprima, nessuna scrittura ---");
  process.exit(0);
}

const immagineRadice =
  (await copiaUpload(val(paginaSorgente.image)?.upload_id)) ??
  IMMAGINE_DI_SCORTA;

if (!idRadice) {
  const creata = await conRitentativi("pagina radice", () =>
    to.items.create({
      item_type: { type: "item_type", id: idTarget("page") },
      title: { [LOCALE]: testo(val(paginaSorgente.title)) },
      slug: { [LOCALE]: slugRadice },
      seo: {
        [LOCALE]: {
          title: tronca(
            val(paginaSorgente.seo)?.title || testo(val(paginaSorgente.title)),
            60,
          ),
          description: tronca(
            val(paginaSorgente.seo)?.description ||
              testo(val(paginaSorgente.subtitle)),
            160,
          ),
          image: null,
          no_index: false,
          twitter_card: null,
        },
      },
      content: { [LOCALE]: [] },
    }),
  );
  idRadice = creata.id;
  await to.items.publish(idRadice);
  console.log(`\npagina radice creata: ${idRadice}`);
}

const idPerSlug = new Map(esistentiInsight);
for (const sorgente of sottopagineSorgente) {
  const slug = val(sorgente.slug);
  const daRicostruire = DA_RICOSTRUIRE.includes(slug);
  if (idPerSlug.has(slug) && !daRicostruire) {
    console.log(`${slug}: già presente, salto`);
    continue;
  }
  if (daRicostruire && idPerSlug.has(slug)) {
    const contenuto = await contenutoSottopagina(sorgente);
    await conRitentativi(`rebuild ${slug}`, () =>
      to.items.update(idPerSlug.get(slug), {
        content: { [LOCALE]: contenuto },
      }),
    );
    if (sorgente.meta.status === "published")
      await to.items.publish(idPerSlug.get(slug));
    console.log(`${slug.padEnd(34)} ricostruita (${contenuto.length} sezioni)`);
    continue;
  }
  const titolo = testo(val(sorgente.title));
  const sottotitolo = testo(val(sorgente.subtitle));
  const sommario = testo(val(sorgente.summary)) || sottotitolo;
  const copertina =
    (await copiaUpload(val(sorgente.image_cover)?.upload_id)) ?? immagineRadice;
  const contenuto = await contenutoSottopagina(sorgente);

  const creata = await conRitentativi(slug, () =>
    to.items.create({
      item_type: { type: "item_type", id: idTarget("insight") },
      parent_page: { [LOCALE]: idRadice },
      title: { [LOCALE]: titolo },
      slug: { [LOCALE]: slug },
      abstract: { [LOCALE]: sommario },
      image: { [LOCALE]: { upload_id: copertina } },
      show_sections_nav: Boolean(val(sorgente.content_has_index)),
      seo: {
        [LOCALE]: {
          title: tronca(val(sorgente.seo)?.title || titolo, 60),
          description: tronca(val(sorgente.seo)?.description || sommario, 160),
          image: null,
          no_index: false,
          twitter_card: null,
        },
      },
      content: { [LOCALE]: contenuto },
    }),
  );
  if (sorgente.meta.status === "published") await to.items.publish(creata.id);
  idPerSlug.set(slug, creata.id);
  console.log(
    `${slug.padEnd(34)} creata (${contenuto.length} sezioni, ${sorgente.meta.status})`,
  );
}

console.log("\nsottopagine importate. La pagina radice va composta a parte.");
