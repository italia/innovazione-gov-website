import { buildClient, buildBlockRecord } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const client = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: "website-astro-2026",
});

const TIPI = {
  footerColumn: "c-5xbakCTBuSzIxAxFrkBw",
  externalLink: "fhF1HPNNQlKNy5KNGfLtuw",
  internalLink: "Nwki1YZWRhqgFtIM3Hdgqw",
  mailingList: "AggN5kz6TiutVcTPwgP1dQ",
};

const PAGINA_PRIVACY = "QpO3I04YSr2kZUJEFiqziw";
const PAGINA_NOTE_LEGALI = "R2GJSq-DRSiVZBP4pIS3BQ";
const DICHIARAZIONE_ACCESSIBILITA =
  "https://form.agid.gov.it/PCM/Risultati_PNRR/dichiarazione";

const esterno = (label, url) =>
  buildBlockRecord({
    item_type: { type: "item_type", id: TIPI.externalLink },
    label,
    url,
    description: "",
  });

const interno = (label, linkTo, anchor = "") =>
  buildBlockRecord({
    item_type: { type: "item_type", id: TIPI.internalLink },
    label,
    link_to: linkTo,
    anchor,
  });

const colonna = (title, links) =>
  buildBlockRecord({
    item_type: { type: "item_type", id: TIPI.footerColumn },
    title,
    links,
  });

const newsletter = (title, labelPrivacy) =>
  buildBlockRecord({
    item_type: { type: "item_type", id: TIPI.mailingList },
    title,
    privacy_policy: interno(labelPrivacy, PAGINA_PRIVACY),
  });

const layout = (await client.itemTypes.list()).find(
  (t) => t.api_key === "layout",
);
const record = (
  await client.items.list({ filter: { type: layout.id }, version: "current" })
)[0];

await client.items.update(record.id, {
  contact_title: { it: "Sede legale", en: "Registered office" },
  utility_title: { it: "Social", en: "Social" },
  footer_columns: {
    it: [
      colonna("Altri siti web", [
        esterno("Sito del Governo Italiano", "https://www.governo.it/"),
        esterno(
          "Amministrazione Trasparente",
          "https://innovazione.gov.it/amministrazione-trasparente/",
        ),
        esterno(
          "AgID - Agenzia per l'Italia Digitale",
          "https://www.agid.gov.it/",
        ),
        esterno("PagoPA S.p.A.", "https://www.pagopa.gov.it/"),
      ]),
    ],
    en: [
      colonna("Other websites", [
        esterno("Italian Government website", "https://www.governo.it/"),
        esterno(
          "Transparent Administration",
          "https://innovazione.gov.it/amministrazione-trasparente/",
        ),
        esterno("AgID - Agency for Digital Italy", "https://www.agid.gov.it/"),
        esterno("PagoPA S.p.A.", "https://www.pagopa.gov.it/"),
      ]),
    ],
  },
  small_print: {
    it: [
      interno("Note Legali", PAGINA_NOTE_LEGALI),
      interno("Privacy Policy", PAGINA_PRIVACY),
      interno("Gestione Cookie", PAGINA_PRIVACY, "cookies-management"),
      esterno("Dichiarazione Accessibilità", DICHIARAZIONE_ACCESSIBILITA),
    ],
    en: [
      interno("Legal Notice", PAGINA_NOTE_LEGALI),
      interno("Privacy Policy", PAGINA_PRIVACY),
      interno("Cookie Settings", PAGINA_PRIVACY, "cookies-management"),
      esterno("Accessibility Statement", DICHIARAZIONE_ACCESSIBILITA),
    ],
  },
  mailing_list_form: {
    it: newsletter(
      "Rimani aggiornato con le novità del Dipartimento - iscriviti alla newsletter",
      "Informativa sulla privacy",
    ),
    en: newsletter(
      "Keep up with the Department news - subscribe to the newsletter",
      "Privacy policy",
    ),
  },
});

await client.items.publish(record.id);
console.log("Layout aggiornato e pubblicato");
