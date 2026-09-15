import { buildBlockRecord, buildClient } from "@datocms/cma-client-node";
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

const tipiTarget = await to.itemTypes.list();
const chiaveTarget = Object.fromEntries(
  tipiTarget.map((t) => [t.id, t.api_key]),
);
const idTarget = (key) => tipiTarget.find((t) => t.api_key === key).id;

async function copiaUpload(idSorgente) {
  const sorgente = await from.uploads.find(idSorgente);
  if (!COMMIT) return `anteprima:${sorgente.filename}`;
  const creato = await to.uploads.createFromUrl({
    url: sorgente.url,
    filename: sorgente.filename,
    skipCreationIfAlreadyExists: true,
  });
  return creato.id;
}

const [pagina] = await to.items.list({
  filter: {
    type: idTarget("page"),
    fields: { slug: { eq: "italia-digitale-2026" } },
  },
  version: "current",
  nested: true,
});
if (!pagina) throw new Error("pagina italia-digitale-2026 non trovata");
const contenuto = pagina.content[LOCALE];

const daRifare = {
  "Candidati agli avvisi per le PA locali": {
    titolo: "Candidati agli avvisi per le PA locali",
    paragrafo: "Scopri tutti gli avvisi e candida la tua PA",
    etichettaCta: "Vai al sito PA digitale 2026",
    url: "https://padigitale2026.gov.it/",
    uploadSorgente: "GVK1PxRLTrqyj8slNs_bgg",
    alt: "Il portale PA digitale 2026 su desktop, tablet e smartphone",
  },
  "Le risorse per le PA locali": {
    titolo: "PA digitale 2026",
    paragrafo: "Le risorse per le PA locali",
    etichettaCta: "Vai al sito PA digitale 2026",
    url: "https://padigitale2026.gov.it/",
    alt: "Illustrazione di una città",
  },
  "Il Piano nazionale di ripresa e resilienza": {
    titolo: "Italia Domani, scopri tutti i dettagli",
    paragrafo: "Il Piano nazionale di ripresa e resilienza",
    etichettaCta: "Vai sul sito del Governo",
    url: "https://italiadomani.gov.it/",
    alt: "Il logo di Italia Domani",
  },
};

const nuovoContenuto = [];
for (const blocco of contenuto) {
  const chiave = chiaveTarget[blocco.relationships.item_type.data.id];
  const titoloAttuale = blocco.attributes?.text?.attributes?.title;
  const ricetta = chiave === "text_image" ? daRifare[titoloAttuale] : undefined;
  if (!ricetta) {
    nuovoContenuto.push(blocco.id);
    continue;
  }

  const immagine = ricetta.uploadSorgente
    ? {
        upload_id: await copiaUpload(ricetta.uploadSorgente),
        alt: ricetta.alt,
        title: "",
        custom_data: {},
      }
    : { ...blocco.attributes.image, alt: ricetta.alt };

  console.log(
    `sezione "${titoloAttuale}" → "${ricetta.titolo}" | ${ricetta.paragrafo} | ${ricetta.etichettaCta} | immagine ${immagine.upload_id}`,
  );

  nuovoContenuto.push({
    id: blocco.id,
    type: "item",
    attributes: {
      variant: blocco.attributes.variant,
      background_color: blocco.attributes.background_color,
      heading: blocco.attributes.heading,
      menu_label: blocco.attributes.menu_label,
      additional_content: null,
      image: immagine,
      text: {
        id: blocco.attributes.text.id,
        type: "item",
        attributes: {
          title: ricetta.titolo,
          paragraph: ricetta.paragrafo,
          cta: buildBlockRecord({
            item_type: { type: "item_type", id: idTarget("external_link") },
            label: ricetta.etichettaCta,
            url: ricetta.url,
            description: "",
          }),
        },
        relationships: {
          item_type: {
            data: { id: idTarget("text_block"), type: "item_type" },
          },
        },
      },
    },
    relationships: {
      item_type: { data: { id: idTarget("text_image"), type: "item_type" } },
    },
  });
}

if (!COMMIT) {
  console.log("\nanteprima: nessuna modifica scritta");
  process.exit(0);
}

await to.items.update(pagina.id, { content: { [LOCALE]: nuovoContenuto } });
await to.items.publish(pagina.id);
console.log("\nblocchi PA digitale 2026 rifatti e pubblicati");
