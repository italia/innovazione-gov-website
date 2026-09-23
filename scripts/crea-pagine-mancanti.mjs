import { buildBlockRecord, buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";
import { headingNode, markdownToDastNodes } from "./lib/markdown-to-dast.mjs";

dotenv.config({ path: ".env" });

const TARGET_ENV = "website-astro-2026";
const LOCALE = "it";
const COMMIT = process.argv.includes("--commit");
const IMMAGINE_DI_SCORTA = "ZxJioUtzTUK_lVvA0mFG8g";
const TITOLI_DI_PROVA = /^prova/i;

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

async function copiaUpload(idUpload) {
  if (!idUpload || !COMMIT) return IMMAGINE_DI_SCORTA;
  const origine = await from.uploads.find(idUpload);
  const copiato = await to.uploads.createFromUrl({
    url: origine.url,
    filename: origine.filename,
    skipCreationIfAlreadyExists: true,
  });
  return copiato.id;
}

async function paginaTarget(modello, slug) {
  const [record] = await to.items.list({
    filter: { type: idTarget(modello), fields: { slug: { eq: slug } } },
    version: "current",
  });
  return record ?? null;
}

async function nodiDaBlocchi(sorgente, livelloTitolo = 2) {
  const nodi = [];
  for (const b of elenco(sorgente.content_blocks)) {
    const kind = chiaveSorgente[b.relationships.item_type.data.id];
    const a = b.attributes;

    if (kind === "block_body_text") {
      const titolo = testo(a.text_title);
      if (titolo) nodi.push(headingNode(titolo, livelloTitolo));
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
      if (voci.length)
        nodi.push({
          type: "block",
          item: blocco("accordion_block", {
            title: "",
            accordion: blocco("accordion", { items: voci }),
          }),
        });
      continue;
    }

    if (kind === "block_cta") {
      for (const idCta of a.cta_items ?? []) {
        const cta = await from.items.find(idCta, { version: "current" });
        const url = testo(val(cta.link));
        const etichetta = testo(val(cta.cta_label)) || testo(val(cta.title));
        if (!url || !/^https?:\/\//i.test(url) || !etichetta) continue;
        nodi.push({
          type: "block",
          item: blocco("external_link", {
            label: etichetta,
            url,
            description: testo(val(cta.description)),
          }),
        });
      }
    }
  }
  return nodi;
}

async function collegamentiEsterni(sorgente) {
  const creati = [];
  for (const idLink of elenco(sorgente.links)) {
    const link = await from.items.find(idLink, { version: "current" });
    const url = testo(val(link.link));
    if (!url || !/^https?:\/\//i.test(url)) continue;
    if (!COMMIT) {
      creati.push(url);
      continue;
    }
    const creato = await to.items.create({
      item_type: { type: "item_type", id: idTarget("link_external") },
      title: testo(val(link.title)) || testo(val(link.cta_label)) || url,
      description: testo(val(link.description)),
      link: url,
      cta_label: testo(val(link.cta_label)),
    });
    await to.items.publish(creato.id);
    creati.push(creato.id);
  }
  return creati;
}

async function creaInsight({
  slug,
  titolo,
  sommario,
  genitore,
  nodi,
  collegamenti = [],
  indice = true,
  copertina,
}) {
  const creato = await to.items.create({
    item_type: { type: "item_type", id: idTarget("insight") },
    parent_page: { [LOCALE]: genitore.id },
    title: { [LOCALE]: titolo },
    slug: { [LOCALE]: slug },
    abstract: { [LOCALE]: sommario },
    image: { [LOCALE]: { upload_id: copertina ?? IMMAGINE_DI_SCORTA } },
    show_sections_nav: indice,
    sections_nav_layout: "horizontal",
    links: collegamenti,
    seo: {
      [LOCALE]: {
        title: tronca(titolo, 60),
        description: tronca(sommario, 160),
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
          paragraph: sommario,
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
  return creato;
}

const dipartimento = await paginaTarget("page", "dipartimento");
const innovaConNoi = await paginaTarget("page", "innova-con-noi");
const novita = await paginaTarget("page", "novita");

console.log("## Gli uffici");
{
  const esistente = await paginaTarget("insight", "gli-uffici");
  if (esistente) console.log("   già presente");
  else {
    const [sorgente] = await from.items.list({
      filter: {
        type: idSorgente("department_subpage"),
        fields: { slug: { eq: "gli-uffici" } },
      },
      version: "current",
      nested: true,
    });
    const nodi = await nodiDaBlocchi(sorgente);
    console.log(`   da creare sotto /dipartimento: ${nodi.length} nodi`);
    if (COMMIT) {
      const creato = await creaInsight({
        slug: "gli-uffici",
        titolo: testo(val(sorgente.title)),
        sommario: testo(val(sorgente.subtitle)),
        genitore: dipartimento,
        nodi,
      });
      console.log("   creata:", creato.id);
    }
  }
}

console.log("\n## Attività internazionali");
{
  const esistente = await paginaTarget("insight", "attivita-internazionali");
  if (esistente) console.log("   già presente");
  else {
    const [sorgente] = await from.items.list({
      filter: {
        type: idSorgente("projects_subpage"),
        fields: { slug: { eq: "attivita-internazionali" } },
      },
      version: "current",
      nested: true,
    });
    const nodi = await nodiDaBlocchi(sorgente);
    const collegamenti = await collegamentiEsterni(sorgente);
    console.log(
      `   da creare sotto /dipartimento: ${nodi.length} nodi, ${collegamenti.length} collegamenti`,
    );
    if (COMMIT) {
      const creato = await creaInsight({
        slug: "attivita-internazionali",
        titolo: testo(val(sorgente.title)),
        sommario: testo(val(sorgente.subtitle)),
        genitore: dipartimento,
        nodi,
        collegamenti,
        copertina: await copiaUpload(val(sorgente.image_cover)?.upload_id),
      });
      console.log("   creata:", creato.id);
    }
  }
}

console.log("\n## Le posizioni lavorative");
{
  const esistente = await paginaTarget("insight", "posizioni-lavorative");
  if (esistente) console.log("   già presente");
  else {
    const [sorgente] = await from.items.list({
      filter: { type: idSorgente("work_positions_index") },
      version: "current",
    });
    const archivio = await paginaTarget(
      "insight",
      "archivio-posizioni-lavorative",
    );
    const titolo = testo(val(sorgente.title));
    const sommario = testo(val(sorgente.subtitle));
    console.log(
      `   da creare sotto /innova-con-noi: "${titolo}" con rimando all'archivio`,
    );
    if (COMMIT) {
      const nodi = [
        ...markdownToDastNodes(
          "Le posizioni aperte del Dipartimento per la trasformazione digitale sono pubblicate sul portale dedicato alle candidature. Qui sotto trovi l'archivio delle selezioni concluse.",
        ),
      ];
      if (archivio)
        nodi.push({
          type: "block",
          item: blocco("internal_link", {
            label: "Vai all'archivio delle posizioni lavorative",
            link_to: archivio.id,
          }),
        });
      const creato = await creaInsight({
        slug: "posizioni-lavorative",
        titolo,
        sommario,
        genitore: innovaConNoi,
        nodi,
        indice: false,
      });
      console.log("   creata:", creato.id, "— manca il rimando ad Altamira");
    }
  }
}

console.log("\n## Il blog del Dipartimento");
{
  const esistente = await paginaTarget("insight", "blog");
  if (esistente) console.log("   già presente");
  else {
    const articoli = [];
    for await (const m of from.items.listPagedIterator({
      filter: { type: idSorgente("medium_article") },
      version: "current",
    })) {
      const titolo = testo(val(m.title));
      if (!titolo || TITOLI_DI_PROVA.test(titolo)) continue;
      const link = val(m.link_medium)
        ? await from.items.find(val(m.link_medium), { version: "current" })
        : null;
      const url = testo(val(link?.link));
      if (!url) continue;
      articoli.push({
        titolo,
        sottotitolo: testo(val(m.subtitle)),
        url,
        immagine: val(m.image_thumbnail)?.upload_id ?? null,
      });
    }
    console.log(
      `   da creare sotto /novita: ${articoli.length} articoli (esclusi i record di prova)`,
    );
    if (COMMIT) {
      const carte = [];
      for (const a of articoli) {
        carte.push(
          blocco("card_link", {
            title: a.titolo,
            paragraph: a.sottotitolo,
            image: { upload_id: await copiaUpload(a.immagine) },
            link: blocco("link_block", { link: null, external_url: a.url }),
          }),
        );
      }
      const creato = await to.items.create({
        item_type: { type: "item_type", id: idTarget("insight") },
        parent_page: { [LOCALE]: novita.id },
        title: { [LOCALE]: "Il blog del Dipartimento" },
        slug: { [LOCALE]: "blog" },
        abstract: {
          [LOCALE]:
            "Gli articoli scritti dal Dipartimento su Medium: metodo di lavoro, progetti e lezioni imparate.",
        },
        image: { [LOCALE]: { upload_id: IMMAGINE_DI_SCORTA } },
        show_sections_nav: false,
        sections_nav_layout: "horizontal",
        seo: {
          [LOCALE]: {
            title: "Il blog del Dipartimento",
            description: tronca(
              "Gli articoli scritti dal Dipartimento su Medium: metodo di lavoro, progetti e lezioni imparate.",
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
              title: "Il blog del Dipartimento",
              paragraph: "Gli articoli scritti dal Dipartimento su Medium.",
              background_image: null,
              background_image_for_mobile: null,
              cta: null,
            }),
            blocco("card_link_list", {
              show_inline_card: false,
              background_color: "default",
              title: "Gli articoli",
              paragraph:
                "Ogni articolo si apre su Medium, dove il blog è ospitato.",
              list_content: carte,
              last_items: null,
              category: null,
              show_filter_on_category: false,
              cta: null,
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
