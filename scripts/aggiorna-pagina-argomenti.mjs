import { buildBlockRecord, buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const COMMIT = process.argv.includes("--commit");
const TARGET_ENV = "website-astro-2026";
const RECORD = "ecR0D3qjQYKMFY67bX1Xeg";
const LOCALE = "it";

const to = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: TARGET_ENV,
  requestTimeout: 60000,
});

const tipi = await to.itemTypes.list();
const idPer = Object.fromEntries(tipi.map((t) => [t.api_key, t.id]));
const apiKeyPer = Object.fromEntries(tipi.map((t) => [t.id, t.api_key]));

const record = await to.items.find(RECORD, {
  nested: "true",
  version: "current",
});
const contenuto = record.content?.[LOCALE] ?? record.content ?? [];
const tipoDi = (b) =>
  apiKeyPer[b.relationships?.item_type?.data?.id ?? b.item_type?.id];

const hero = contenuto.find((b) => tipoDi(b) === "hero");
const elenco = contenuto.find((b) => tipoDi(b) === "topic_list");
if (!hero || !elenco) throw new Error("blocchi hero o topic_list non trovati");

const rimossi = contenuto.filter(
  (b) => !["hero", "topic_list"].includes(tipoDi(b)),
);

const evidenza = buildBlockRecord({
  item_type: { id: idPer.topic_highlight, type: "item_type" },
  title: "Argomenti in evidenza",
  cards_count: 3,
  background_color: "dark",
});

const elencoAggiornato = buildBlockRecord({
  id: elenco.id,
  item_type: { id: idPer.topic_list, type: "item_type" },
  title: "",
  paragraph:
    "Questo è un elenco alfabetico dei temi del Dipartimento per la trasformazione digitale.\n\nSe un tema non è presente nell'elenco, prova a effettuare una [ricerca](/it/ricerca).",
  background_color: "lighter",
  order: "alfabetico",
  show_count: false,
});

console.log(COMMIT ? `scrittura su ${TARGET_ENV}` : "DRY-RUN (usa --commit)");
console.log(`blocchi attuali: ${contenuto.map(tipoDi).join(", ")}`);
console.log(`blocchi finali: hero, topic_highlight, topic_list`);
if (rimossi.length) console.log(`rimossi: ${rimossi.map(tipoDi).join(", ")}`);

if (COMMIT) {
  await to.items.update(RECORD, {
    content: { [LOCALE]: [hero.id, evidenza, elencoAggiornato] },
  });
  await to.items.publish(RECORD);
  console.log("aggiornato e pubblicato");
}
