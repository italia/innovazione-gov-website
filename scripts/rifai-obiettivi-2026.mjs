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

const val = (campo) => {
  if (!campo || typeof campo !== "object" || Array.isArray(campo))
    return campo ?? null;
  return LOCALE in campo ? (campo[LOCALE] ?? null) : campo;
};
const testo = (v) => String(v ?? "").trim();

const tipiSorgente = await from.itemTypes.list();
const tipiTarget = await to.itemTypes.list();
const chiaveTarget = Object.fromEntries(
  tipiTarget.map((t) => [t.id, t.api_key]),
);
const idSorgente = (key) => tipiSorgente.find((t) => t.api_key === key)?.id;
const idTarget = (key) => tipiTarget.find((t) => t.api_key === key).id;
const chiaveSorgente = Object.fromEntries(
  tipiSorgente.map((t) => [t.id, t.api_key]),
);

async function copiaUpload(idUpload) {
  if (!idUpload) return null;
  const sorgente = await from.uploads.find(idUpload);
  if (!COMMIT) return `anteprima:${sorgente.filename}`;
  const creato = await to.uploads.createFromUrl({
    url: sorgente.url,
    filename: sorgente.filename,
    skipCreationIfAlreadyExists: true,
    default_field_metadata: {
      [LOCALE]: {
        alt: testo(sorgente.default_field_metadata?.[LOCALE]?.alt),
        title: "",
        custom_data: {},
      },
    },
  });
  return creato.id;
}

const [paginaSorgente] = await from.items.list({
  filter: { type: idSorgente("italy2026_page") },
  version: "current",
  nested: true,
});
const blocchiSorgente = val(paginaSorgente.content_blocks) ?? [];
const sorgente = blocchiSorgente.find(
  (b) =>
    chiaveSorgente[b.relationships.item_type.data.id] === "block_italy2026",
);
if (!sorgente)
  throw new Error("blocco block_italy2026 non trovato nel progetto di origine");

const [pagina] = await to.items.list({
  filter: {
    type: idTarget("page"),
    fields: { slug: { eq: "italia-digitale-2026" } },
  },
  version: "current",
  nested: true,
});
if (!pagina) throw new Error("pagina italia-digitale-2026 non trovata");
const contenuto = val(pagina.content) ?? [];
const obiettivi = contenuto.find(
  (b) =>
    chiaveTarget[b.relationships.item_type.data.id] === "text_statistic" &&
    testo(b.attributes.menu_label) === "Gli obiettivi",
);
if (!obiettivi)
  throw new Error("sezione Obiettivi 2026 non trovata nella pagina");

const numeriSorgente = [];
for (const id of sorgente.attributes.percent_numbers ?? []) {
  numeriSorgente.push(
    await from.items.find(id, { version: "current", nested: true }),
  );
}

const kpiEsistenti = obiettivi.attributes.statistics.attributes.kpi_element;
const kpiPerTitolo = new Map();
for (const id of kpiEsistenti) {
  const record = await to.items.find(id, { version: "current" });
  kpiPerTitolo.set(testo(val(record.title)), record);
}

const idKpi = [];
for (const numero of numeriSorgente) {
  const titolo = testo(val(numero.title));
  const attributi = {
    title: titolo,
    value: testo(val(numero.number)),
    value_suffix: "%",
    value_prefix: "",
    percentage: testo(val(numero.number)),
    footer_text: testo(val(numero.description)),
    icon: { upload_id: await copiaUpload(val(numero.image_icon)?.upload_id) },
    show_flow: false,
  };
  const esistente = kpiPerTitolo.get(titolo);
  console.log(
    `kpi ${titolo}: ${attributi.value}${attributi.value_suffix} ${attributi.footer_text} icona=${attributi.icon.upload_id}`,
  );
  if (!COMMIT) {
    idKpi.push(esistente?.id ?? "nuovo");
    continue;
  }
  if (esistente) {
    await to.items.update(esistente.id, attributi);
    await to.items.publish(esistente.id);
    idKpi.push(esistente.id);
  } else {
    const creato = await to.items.create({
      item_type: { type: "item_type", id: idTarget("kpi_element") },
      ...attributi,
    });
    await to.items.publish(creato.id);
    idKpi.push(creato.id);
  }
}

const insight = await to.items.list({
  filter: {
    type: idTarget("insight"),
    fields: { slug: { eq: "gli-obiettivi" } },
  },
  version: "current",
});
const destinazione = insight[0];
if (!destinazione) throw new Error("insight gli-obiettivi non trovato");
const linkSorgente = sorgente.attributes.link
  ? await from.items.find(sorgente.attributes.link, { version: "current" })
  : null;
const etichettaCta = testo(val(linkSorgente?.cta_label)) || "Scopri di più";

const immagine = await copiaUpload(
  val(sorgente.attributes.thumbnail)?.upload_id,
);

const sezioneAggiornata = {
  id: obiettivi.id,
  type: "item",
  attributes: {
    background_color: obiettivi.attributes.background_color,
    show_inline: false,
    menu_label: "Gli obiettivi",
    layout: "cards",
    image: { upload_id: immagine },
    text: {
      id: obiettivi.attributes.text.id,
      type: "item",
      attributes: {
        title: testo(val(sorgente.attributes.title)),
        paragraph: testo(val(sorgente.attributes.text)),
        cta: buildBlockRecord({
          item_type: { type: "item_type", id: idTarget("internal_link") },
          label: etichettaCta,
          link_to: destinazione.id,
        }),
      },
      relationships: {
        item_type: { data: { id: idTarget("text_block"), type: "item_type" } },
      },
    },
    statistics: {
      id: obiettivi.attributes.statistics.id,
      type: "item",
      attributes: { statistics: [], kpi_element: idKpi },
      relationships: {
        item_type: {
          data: { id: idTarget("statistic_block"), type: "item_type" },
        },
      },
    },
  },
  relationships: {
    item_type: { data: { id: idTarget("text_statistic"), type: "item_type" } },
  },
};

console.log(
  "\nsezione:",
  JSON.stringify(
    {
      titolo: sezioneAggiornata.attributes.text.attributes.title,
      paragrafo: sezioneAggiornata.attributes.text.attributes.paragraph,
      cta: etichettaCta,
      destinazione: destinazione.id,
      immagine,
    },
    null,
    1,
  ),
);

if (!COMMIT) {
  console.log("\nanteprima: nessuna modifica scritta");
  process.exit(0);
}

const nuovoContenuto = contenuto.map((b) =>
  b.id === obiettivi.id ? sezioneAggiornata : b.id,
);
await to.items.update(pagina.id, { content: { [LOCALE]: nuovoContenuto } });
await to.items.publish(pagina.id);
console.log("\nsezione Obiettivi 2026 rifatta e pubblicata");
