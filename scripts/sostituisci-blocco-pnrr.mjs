import { buildBlockRecord, buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const COMMIT = process.argv.includes("--commit");
const TARGET_ENV = "website-astro-2026";
const PAGINA_ATTIVITA = "O-jJWH1XQUCeSKtIV8PT1Q";
const ACCORDION_PNRR = "BKYnNrpWThGnADNTdOjfBw";
const RISULTATI_PNRR = "PUM-f16WRJaPRF9vC_A8Xw";
const ATTUAZIONE_MISURE = "Md9flNyhQ8ilJ7THHs78TA";

const client = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: TARGET_ENV,
  requestTimeout: 60000,
});

const tipi = await client.itemTypes.list();
const idPer = Object.fromEntries(tipi.map((t) => [t.api_key, t.id]));
const blocco = (apiKey, campi) =>
  buildBlockRecord({
    item_type: { id: idPer[apiKey], type: "item_type" },
    ...campi,
  });

const card = (title, paragraph, destinazione) =>
  blocco("wide_link_card", {
    title,
    paragraph,
    category: "PNRR",
    image: null,
    image_background: "blu",
    article: null,
    link: blocco("link_block", { link: destinazione, external_url: "" }),
  });

const sezione = blocco("card_link_list", {
  title: "Cosa abbiamo realizzato con il PNRR",
  paragraph:
    "I traguardi raggiunti sulle misure digitali e i dati sugli enti coinvolti.",
  background_color: "lighter",
  show_inline_card: false,
  show_filter_on_category: false,
  menu_label: "",
  last_items: null,
  category: null,
  cta: null,
  list_content: [
    card(
      "Risultati del PNRR",
      "Questo è un testo breve che riassume il contenuto della pagina di destinazione in massimo tre o quattro righe",
      RISULTATI_PNRR,
    ),
    card(
      "Attuazione misure PNRR",
      "Gli obiettivi della strategia nazionale per il digitale e il punto sul loro raggiungimento.",
      ATTUAZIONE_MISURE,
    ),
  ],
});

const pagina = await client.items.find(PAGINA_ATTIVITA, { version: "current" });
const contenuto = pagina.content.it;
const posizione = contenuto.indexOf(ACCORDION_PNRR);
if (posizione === -1)
  throw new Error("blocco accordion non trovato nella pagina");

const nuovoContenuto = contenuto.map((id, i) =>
  i === posizione ? sezione : id,
);

console.log(COMMIT ? `scrittura su ${TARGET_ENV}` : "DRY-RUN (usa --commit)");
console.log(
  `blocchi: ${contenuto.length}, sostituisco il numero ${posizione} (${ACCORDION_PNRR})`,
);

if (!COMMIT) process.exit(0);

await client.items.update(PAGINA_ATTIVITA, { content: { it: nuovoContenuto } });
await client.items.publish(PAGINA_ATTIVITA);
console.log("pagina Attività aggiornata e pubblicata");
