import { buildBlockRecord, buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const TARGET_ENV = "website-astro-2026";
const commit = process.argv.includes("--commit");

const client = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: TARGET_ENV,
  requestTimeout: 120000,
});

const itemTypes = await client.itemTypes.list();
const idPer = (apiKey) => {
  const trovato = itemTypes.find((t) => t.api_key === apiKey);
  if (!trovato) throw new Error(`modello o blocco \`${apiKey}\` non trovato`);
  return trovato.id;
};

const span = (value) => ({ type: "span", value });
const mailto = (indirizzo) => ({
  type: "link",
  url: `mailto:${indirizzo}`,
  children: [span(indirizzo)],
});
const esterno = (url, label) => ({
  type: "link",
  url,
  meta: [{ id: "target", value: "_blank" }],
  children: [span(label)],
});
const paragrafo = (children) => ({ type: "paragraph", children });
const elenco = (children) => ({
  type: "list",
  style: "bulleted",
  children: children.map((inline) => ({
    type: "listItem",
    children: [paragrafo(inline)],
  })),
});
const documento = (children) => ({
  schema: "dast",
  document: { type: "root", children },
});

const AGID_ACCESSIBILITA =
  "https://www.agid.gov.it/it/design-servizi/accessibilita";
const FORUM_ITALIA = "https://forum.italia.it/";

const contenuto = {
  it: documento([
    paragrafo([
      span(
        "Per qualsiasi informazione sulle attività o segnalazione sui nostri progetti, scrivi a:",
      ),
    ]),
    elenco([
      [
        mailto("segreteria.trasformazionedigitale@governo.it"),
        span(" (Dipartimento per la trasformazione digitale)."),
      ],
    ]),
    paragrafo([span("Contatti PEC:")]),
    elenco([
      [
        mailto("diptrasformazionedigitale@pec.governo.it"),
        span(" (Dipartimento per la trasformazione digitale)."),
      ],
    ]),
    paragrafo([
      span("Richieste media: "),
      mailto("comunicazione@innovazione.gov.it"),
    ]),
    paragrafo([
      span(
        "Per segnalazioni o suggerimenti sull'accessibilità del sito, scrivi a ",
      ),
      mailto("accessibilita@innovazione.gov.it"),
      span(". "),
      esterno(AGID_ACCESSIBILITA, "Scopri di più sull'accessibilità"),
      span("."),
    ]),
    paragrafo([
      span(
        "Per feedback e per discutere nel dettaglio degli aspetti operativi dei nostri progetti, prendi parte alle discussioni su ",
      ),
      esterno(FORUM_ITALIA, "Forum Italia"),
      span("."),
    ]),
    paragrafo([span("Largo Pietro di Brazzà, 86\n00187 Roma - Italia")]),
  ]),
  en: documento([
    paragrafo([
      span(
        "For any information about our work, or to report an issue with one of our projects, write to:",
      ),
    ]),
    elenco([
      [
        mailto("segreteria.trasformazionedigitale@governo.it"),
        span(" (Department for Digital Transformation)."),
      ],
    ]),
    paragrafo([span("Certified email (PEC):")]),
    elenco([
      [
        mailto("diptrasformazionedigitale@pec.governo.it"),
        span(" (Department for Digital Transformation)."),
      ],
    ]),
    paragrafo([
      span("Media enquiries: "),
      mailto("comunicazione@innovazione.gov.it"),
    ]),
    paragrafo([
      span(
        "To report a problem with the accessibility of this website, or to suggest an improvement, write to ",
      ),
      mailto("accessibilita@innovazione.gov.it"),
      span(". "),
      esterno(AGID_ACCESSIBILITA, "Read more about accessibility"),
      span("."),
    ]),
    paragrafo([
      span(
        "For feedback, and to discuss the operational details of our projects, join the discussions on ",
      ),
      esterno(FORUM_ITALIA, "Forum Italia"),
      span("."),
    ]),
    paragrafo([span("Largo Pietro di Brazzà, 86\n00187 Rome - Italy")]),
  ]),
};

const hero = (title, paragraph) =>
  buildBlockRecord({
    item_type: { type: "item_type", id: idPer("hero") },
    variant: "xsmall-compact",
    background_color: "lighter",
    show_breadcrumb: true,
    title,
    paragraph,
  });

const testo = (locale) =>
  buildBlockRecord({
    item_type: { type: "item_type", id: idPer("structured_text") },
    background_color: "",
    content: contenuto[locale],
    show_page_index: false,
    font_serif: false,
  });

const riscrivi = process.argv.includes("--riscrivi");

const [esistente] = await client.items.list({
  filter: { type: idPer("page"), fields: { slug: { eq: "contatti" } } },
  version: "current",
});

let paginaContatti = esistente?.id ?? null;

const campiPagina = () => ({
  title: { it: "Contatti", en: "Contacts" },
  slug: { it: "contatti", en: "contacts" },
  content_type: "",
  show_sections_nav: false,
  sections_nav_layout: "horizontal",
  content: {
    it: [
      hero(
        "Contatti",
        "Ricevi informazioni sulle attività del Dipartimento per la trasformazione digitale",
      ),
      testo("it"),
    ],
    en: [
      hero(
        "Contacts",
        "Get in touch with the Department for Digital Transformation",
      ),
      testo("en"),
    ],
  },
  seo: {
    it: {
      title: "Contatti",
      description:
        "Ricevi informazioni sulle attività del Dipartimento per la trasformazione digitale della Presidenza del Consiglio dei ministri",
      image: null,
      no_index: false,
      twitter_card: null,
    },
    en: {
      title: "Contacts",
      description:
        "Get information about the activities of the Department for Digital Transformation of the Presidency of the Council of Ministers",
      image: null,
      no_index: false,
      twitter_card: null,
    },
  },
});

if (esistente && !riscrivi) {
  console.log(
    `pagina già presente: ${esistente.id} (usa --riscrivi per rifare i contenuti)`,
  );
} else if (esistente && commit) {
  await client.items.update(esistente.id, campiPagina());
  await client.items.publish(esistente.id);
  console.log(`contenuti riscritti e ripubblicati: ${esistente.id}`);
} else if (commit) {
  const creata = await client.items.create({
    item_type: { type: "item_type", id: idPer("page") },
    tags: [],
    ...campiPagina(),
  });
  await client.items.publish(creata.id);
  paginaContatti = creata.id;
  console.log(`pagina creata e pubblicata: ${creata.id}`);
} else {
  console.log(
    esistente
      ? "--- anteprima --- i contenuti della pagina Contatti verrebbero riscritti"
      : "--- anteprima --- la pagina Contatti verrebbe creata ora",
  );
}

const layout = (
  await client.items.list({ filter: { type: idPer("layout") } })
)[0];
const layoutNested = await client.items.find(layout.id, {
  nested: true,
  version: "current",
});

const etichettaContatti = { it: "Contatti", en: "Contacts" };
const giaNelFooter = ["it", "en"].every((locale) =>
  (layoutNested.small_print[locale] ?? []).some(
    (b) => b.attributes.label === etichettaContatti[locale],
  ),
);

if (giaNelFooter) {
  console.log("il link Contatti è già nel footer");
} else if (commit && paginaContatti) {
  const small_print = Object.fromEntries(
    ["it", "en"].map((locale) => [
      locale,
      [
        buildBlockRecord({
          item_type: { type: "item_type", id: idPer("internal_link") },
          label: etichettaContatti[locale],
          link_to: paginaContatti,
          anchor: "",
        }),
        ...(layoutNested.small_print[locale] ?? []).map((b) => b.id),
      ],
    ]),
  );
  await client.items.update(layout.id, { small_print });
  if (layout.meta.status === "published") await client.items.publish(layout.id);
  console.log("link Contatti aggiunto in cima allo small print del footer");
} else {
  console.log(
    "--- anteprima --- il link Contatti verrebbe messo in cima allo small print",
  );
}
