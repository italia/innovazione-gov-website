import { buildBlockRecord, buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";
import { headingNode, markdownToDastNodes } from "./lib/markdown-to-dast.mjs";

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
const tronca = (v, max) =>
  testo(v).length <= max
    ? testo(v)
    : `${testo(v)
        .slice(0, max - 1)
        .trimEnd()}…`;

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

const IMMAGINE_DI_SCORTA = "ZxJioUtzTUK_lVvA0mFG8g";

const ARCHIVIATE = [
  "task-force-covid-19",
  "banda-ultra-larga",
  "identita-digitale-spid-cie",
  "madeit",
  "mobility-as-a-service-for-italy",
  "solidarieta-digitale",
];

const [attivita] = await to.items.list({
  filter: { type: idTarget("page"), fields: { slug: { eq: "attivita" } } },
  version: "current",
});
if (!attivita) throw new Error("pagina Attività non trovata");

const [sorgente] = await from.items.list({
  filter: {
    type: idSorgente("department_subpage"),
    fields: { slug: { eq: "task-force-covid-19" } },
  },
  version: "current",
  nested: true,
});
if (!sorgente)
  throw new Error("Task force Covid-19 non trovata nel vecchio CMS");

async function recordSorgente(id) {
  return from.items.find(id, { version: "current" });
}

async function nodiDelTestoTaskForce() {
  const nodi = [];
  for (const b of val(sorgente.content_blocks) ?? []) {
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
        const voce = await recordSorgente(idVoce);
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
        const cta = await recordSorgente(idCta);
        const url = testo(val(cta.link));
        const etichetta = testo(val(cta.cta_label)) || testo(val(cta.title));
        if (!url || !etichetta) continue;
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

async function insightPerSlug(slug) {
  const [record] = await to.items.list({
    filter: { type: idTarget("insight"), fields: { slug: { eq: slug } } },
    version: "current",
  });
  return record ?? null;
}

let archivio = await insightPerSlug("archivio-attivita");
const titoloArchivio = "Archivio attività";
const sommarioArchivio =
  "Cosa abbiamo fatto: le attività che il Dipartimento ha portato avanti negli anni passati.";

if (archivio) console.log(`archivio-attivita: già presente (${archivio.id})`);
else console.log(`archivio-attivita: da creare sotto /attivita`);

async function articoloPerSlug(slug) {
  const [record] = await to.items.list({
    filter: { type: idTarget("article"), fields: { slug: { eq: slug } } },
    version: "current",
  });
  return record ?? null;
}

let taskForce = await articoloPerSlug("task-force-covid-19");
console.log(`task-force-covid-19: ${taskForce ? "già presente" : "da creare"}`);

const carte = [];
for (const slug of ARCHIVIATE) {
  if (slug === "task-force-covid-19") continue;
  const [articolo] = await to.items.list({
    filter: { type: idTarget("article"), fields: { slug: { eq: slug } } },
    version: "current",
  });
  if (!articolo) {
    console.log(`   carta ${slug}: articolo non trovato, salto`);
    continue;
  }
  if (articolo.meta.status !== "published") {
    console.log(`   carta ${slug}: articolo in bozza, resta fuori dall'elenco`);
    continue;
  }
  carte.push({
    id: articolo.id,
    titolo: testo(val(articolo.title)),
    paragrafo:
      testo(val(articolo.paragraph)) || testo(val(articolo.description)),
    immagine: val(articolo.image)?.upload_id ?? null,
  });
}
console.log(
  "attività storiche in elenco:",
  carte.map((c) => c.titolo).join(", "),
);

if (!COMMIT) {
  console.log("\nanteprima: nessuna scrittura");
  process.exit(0);
}

if (!archivio) {
  archivio = await to.items.create({
    item_type: { type: "item_type", id: idTarget("insight") },
    parent_page: { [LOCALE]: attivita.id },
    title: { [LOCALE]: titoloArchivio },
    slug: { [LOCALE]: "archivio-attivita" },
    abstract: { [LOCALE]: sommarioArchivio },
    image: { [LOCALE]: { upload_id: IMMAGINE_DI_SCORTA } },
    show_sections_nav: false,
    sections_nav_layout: "horizontal",
    seo: {
      [LOCALE]: {
        title: tronca(titoloArchivio, 60),
        description: tronca(sommarioArchivio, 160),
        image: null,
        no_index: false,
        twitter_card: null,
      },
    },
    content: { [LOCALE]: [] },
  });
  await to.items.publish(archivio.id);
  console.log("archivio creato:", archivio.id);
}

if (!taskForce) {
  const nodi = await nodiDelTestoTaskForce();
  const titolo = testo(val(sorgente.title));
  const sottotitolo = testo(val(sorgente.subtitle));
  taskForce = await to.items.create({
    item_type: { type: "item_type", id: idTarget("article") },
    article_type: "project",
    parent_page: { [LOCALE]: archivio.id },
    title: { [LOCALE]: titolo },
    slug: { [LOCALE]: "task-force-covid-19" },
    paragraph: { [LOCALE]: sottotitolo },
    description: { [LOCALE]: sottotitolo },
    image: { [LOCALE]: { upload_id: IMMAGINE_DI_SCORTA } },
    show_sidebar: Boolean(val(sorgente.content_has_index)),
    date_shown: val(sorgente.date_shown) ?? null,
    seo: {
      [LOCALE]: {
        title: tronca(val(sorgente.seo)?.title || titolo, 60),
        description: tronca(val(sorgente.seo)?.description || sottotitolo, 160),
        image: null,
        no_index: false,
        twitter_card: null,
      },
    },
    content: {
      [LOCALE]: { schema: "dast", document: { type: "root", children: nodi } },
    },
  });
  await to.items.publish(taskForce.id);
  console.log("task force creata:", taskForce.id);
}

const elenco = [
  blocco("card_link", {
    title: testo(val(sorgente.title)),
    paragraph: testo(val(sorgente.subtitle)),
    image: { upload_id: IMMAGINE_DI_SCORTA },
    link: blocco("link_block", { link: taskForce.id, external_url: "" }),
  }),
  ...carte.map((c) =>
    blocco("card_link", {
      title: c.titolo,
      paragraph: c.paragrafo,
      image: { upload_id: c.immagine ?? IMMAGINE_DI_SCORTA },
      link: blocco("link_block", { link: c.id, external_url: "" }),
    }),
  ),
];

await to.items.update(archivio.id, {
  content: {
    [LOCALE]: [
      blocco("hero", {
        variant: "small",
        background_color: "lighter",
        show_breadcrumb: true,
        title: titoloArchivio,
        paragraph: sommarioArchivio,
        background_image: null,
        background_image_for_mobile: null,
        cta: null,
      }),
      blocco("card_link_list", {
        show_inline_card: false,
        background_color: "default",
        title: "Cosa abbiamo fatto",
        paragraph:
          "I progetti e le iniziative concluse, con le pagine che ne raccontano il percorso.",
        list_content: elenco,
        last_items: null,
        category: null,
        show_filter_on_category: false,
        cta: null,
      }),
    ],
  },
});
await to.items.publish(archivio.id);
console.log(`archivio aggiornato: ${elenco.length} attività in elenco`);
