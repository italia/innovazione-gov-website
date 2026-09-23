import { buildBlockRecord, buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";
import { headingNode, markdownToDastNodes } from "./lib/markdown-to-dast.mjs";

dotenv.config({ path: ".env" });

const TARGET_ENV = "website-astro-2026";
const LOCALE = "it";
const COMMIT = process.argv.includes("--commit");
const IMMAGINE_DI_SCORTA = "ZxJioUtzTUK_lVvA0mFG8g";

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
const tronca = (v, max) =>
  testo(v).length <= max
    ? testo(v)
    : `${testo(v)
        .slice(0, max - 1)
        .trimEnd()}…`;
const elenco = (campo) => {
  const v = val(campo) ?? campo;
  return Array.isArray(v) ? v : [];
};

const tipiSorgente = await from.itemTypes.list();
const tipiTarget = await to.itemTypes.list();
const chiaveSorgente = Object.fromEntries(
  tipiSorgente.map((t) => [t.id, t.api_key]),
);
const idSorgente = (key) => tipiSorgente.find((t) => t.api_key === key)?.id;
const idTarget = (key) => tipiTarget.find((t) => t.api_key === key).id;
const blocco = (key, attributi) =>
  buildBlockRecord({
    item_type: { type: "item_type", id: idTarget(key) },
    ...attributi,
  });

async function sorgentePerSlug(modello, slug) {
  const [record] = await from.items.list({
    filter: { type: idSorgente(modello), fields: { slug: { eq: slug } } },
    version: "current",
    nested: true,
  });
  return record;
}

async function insightPerSlug(slug) {
  const [record] = await to.items.list({
    filter: { type: idTarget("insight"), fields: { slug: { eq: slug } } },
    version: "current",
  });
  return record ?? null;
}

let vociAccordion = 0;

async function nodiDaBlocchi(sorgente) {
  const nodi = [];
  for (const b of elenco(sorgente.content_blocks)) {
    const kind = chiaveSorgente[b.relationships.item_type.data.id];
    const a = b.attributes;

    if (kind === "block_body_text") {
      const titolo = testo(a.text_title);
      if (titolo) nodi.push(headingNode(titolo, 3));
      nodi.push(...markdownToDastNodes(a.body_text));
      continue;
    }

    if (kind === "block_accordion") {
      const voci = [];
      for (const idVoce of a.accordion_items ?? []) {
        const voce = await from.items.find(idVoce, { version: "current" });
        const intestazione = testo(
          val(voce.accordion_item_title) ?? val(voce.title),
        );
        const corpo = testo(
          val(voce.accordion_item_body_text) ?? val(voce.body),
        );
        if (!intestazione && !corpo) continue;
        voci.push(
          blocco("accordion_item", { header: intestazione, body: corpo }),
        );
      }
      vociAccordion += voci.length;
      if (voci.length)
        nodi.push({
          type: "block",
          item: blocco("accordion_block", {
            title: "",
            accordion: blocco("accordion", { items: voci }),
          }),
        });
    }
  }
  return nodi;
}

console.log("## Deleghe · allegato e collegamento");
{
  const sorgente = await sorgentePerSlug("undersecretary_subpage", "deleghe");
  const target = await insightPerSlug("deleghe");
  if (!sorgente || !target) console.log("   pagina non trovata");
  else {
    const allegatiAttuali = elenco(target.attachments);
    const collegamentiAttuali = elenco(target.links);
    const nuoviAllegati = [...allegatiAttuali];
    const nuoviCollegamenti = [...collegamentiAttuali];
    const aggiunti = [];

    for (const idAllegato of elenco(sorgente.attachments)) {
      if (allegatiAttuali.length) break;
      const sorgenteAllegato = await from.items.find(idAllegato, {
        version: "current",
      });
      const upload = val(sorgenteAllegato.file)?.upload_id;
      if (!upload) continue;
      const titolo = testo(val(sorgenteAllegato.file_title)) || "Allegato";
      aggiunti.push(`allegato "${titolo}"`);
      if (!COMMIT) continue;
      const origine = await from.uploads.find(upload);
      const copiato = await to.uploads.createFromUrl({
        url: origine.url,
        filename: origine.filename,
        skipCreationIfAlreadyExists: true,
      });
      const creato = await to.items.create({
        item_type: { type: "item_type", id: idTarget("attachment") },
        file_title: titolo,
        file_description: testo(val(sorgenteAllegato.file_description)),
        file: { upload_id: copiato.id },
      });
      await to.items.publish(creato.id);
      nuoviAllegati.push(creato.id);
    }

    for (const idLink of elenco(sorgente.links)) {
      if (collegamentiAttuali.length) break;
      const sorgenteLink = await from.items.find(idLink, {
        version: "current",
      });
      const url = testo(val(sorgenteLink.link));
      if (!url || !/^https?:\/\//i.test(url)) continue;
      const titolo =
        testo(val(sorgenteLink.title)) ||
        testo(val(sorgenteLink.cta_label)) ||
        url;
      aggiunti.push(`collegamento "${titolo}"`);
      if (!COMMIT) continue;
      const creato = await to.items.create({
        item_type: { type: "item_type", id: idTarget("link_external") },
        title: titolo,
        description: testo(val(sorgenteLink.description)),
        link: url,
        cta_label: testo(val(sorgenteLink.cta_label)),
      });
      await to.items.publish(creato.id);
      nuoviCollegamenti.push(creato.id);
    }

    console.log(
      aggiunti.length ? `   ${aggiunti.join(", ")}` : "   già completa",
    );
    if (COMMIT && aggiunti.length) {
      await to.items.update(target.id, {
        attachments: nuoviAllegati,
        links: nuoviCollegamenti,
      });
      await to.items.publish(target.id);
    }
  }
}

console.log("\n## Domande frequenti · pagina da importare");
{
  const sorgente = await sorgentePerSlug(
    "innovate_subpage",
    "domande-frequenti",
  );
  const esistente = await insightPerSlug("domande-frequenti");
  const [genitore] = await to.items.list({
    filter: {
      type: idTarget("page"),
      fields: { slug: { eq: "innova-con-noi" } },
    },
    version: "current",
  });
  if (esistente) console.log("   già presente");
  else if (!sorgente || !genitore)
    console.log("   sorgente o pagina madre mancante");
  else {
    const nodi = await nodiDaBlocchi(sorgente);
    const voci = vociAccordion;
    const titolo = testo(val(sorgente.title));
    const sottotitolo = testo(val(sorgente.subtitle));
    console.log(
      `   da creare: "${titolo}" con ${nodi.length} nodi (${voci} voci di accordion)`,
    );
    if (COMMIT) {
      const creato = await to.items.create({
        item_type: { type: "item_type", id: idTarget("insight") },
        parent_page: { [LOCALE]: genitore.id },
        title: { [LOCALE]: titolo },
        slug: { [LOCALE]: "domande-frequenti" },
        abstract: { [LOCALE]: sottotitolo },
        image: { [LOCALE]: { upload_id: IMMAGINE_DI_SCORTA } },
        show_sections_nav: false,
        sections_nav_layout: "horizontal",
        seo: {
          [LOCALE]: {
            title: tronca(val(sorgente.seo)?.title || titolo, 60),
            description: tronca(
              val(sorgente.seo)?.description || sottotitolo,
              160,
            ),
            image: null,
            no_index: false,
            twitter_card: null,
          },
        },
        content: {
          [LOCALE]: [
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
      });
      await to.items.publish(creato.id);
      console.log("   creata:", creato.id);
    }
  }
}

if (!COMMIT) console.log("\nanteprima: nessuna scrittura");
