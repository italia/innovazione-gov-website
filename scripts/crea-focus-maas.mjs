import { buildBlockRecord, buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";
import {
  dastDocument,
  headingNode,
  markdownToDastNodes,
} from "./lib/markdown-to-dast.mjs";

dotenv.config({ path: ".env" });

const COMMIT = process.argv.includes("--commit");
const TARGET_ENV = "website-astro-2026";
const SLUG = "approfondimento-maas";
const LOCALE = "it";
const IMMAGINE = "CgySPPBaQI-_3IvxyKBQkg";

const to = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: TARGET_ENV,
  requestTimeout: 60000,
});

const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const elenca = async (filter) => {
  const items = [];
  for await (const item of to.items.listPagedIterator({
    filter,
    version: "current",
  }))
    items.push(item);
  return items;
};

const tipi = await to.itemTypes.list();
const idPer = Object.fromEntries(tipi.map((t) => [t.api_key, t.id]));
const blocco = (apiKey, campi) =>
  buildBlockRecord({
    item_type: { id: idPer[apiKey], type: "item_type" },
    ...campi,
  });

const tag = await elenca({ type: idPer.tag });
const idTag = (nome) => {
  const trovato = tag.find((t) => norm(t.name) === norm(nome));
  if (!trovato) throw new Error(`tag «${nome}» non trovato`);
  return trovato.id;
};

const articoli = await elenca({ type: idPer.article });
const slugDi = (r) => (typeof r.slug === "object" ? r.slug?.[LOCALE] : r.slug);
const titoloDi = (r) =>
  typeof r.title === "object" ? r.title?.[LOCALE] : r.title;
const perSlug = (slug) => {
  const trovato = articoli.find((r) => slugDi(r) === slug);
  if (!trovato) throw new Error(`articolo «${slug}» non trovato`);
  return trovato;
};

const esistente = articoli.find((r) => slugDi(r) === SLUG);

const vociOrdinate = [
  [
    "Testare le innovazioni sul campo",
    "Le soluzioni e le tecnologie innovative vengono provate in condizioni reali ma controllate. Così è possibile capire quali funzionano e meritano un investimento.",
  ],
  [
    "Coinvolgere le persone",
    "Gli utenti partecipano attivamente al processo di innovazione grazie a strategie di co-creazione, che li rendono parte della sperimentazione.",
  ],
  [
    "Fare squadra tra quattro mondi",
    "Governo, industria, università e società civile, la cosiddetta quadrupla elica, cooperano in un'ottica di innovazione aperta.",
  ],
];

const obiettivi = [
  ["Obiettivo 1", "Rispondere ai bisogni reali dei cittadini."],
  [
    "Obiettivo 2",
    "Mettere a sistema le esigenze del territorio e l'offerta d'innovazione di ricerca e imprese.",
  ],
  ["Obiettivo 3", "Potenziare l'infrastruttura tecnologica a disposizione."],
  [
    "Obiettivo 4",
    "Testare diverse ipotesi di servizio e individuare quelle su cui investire.",
  ],
  [
    "Obiettivo 5",
    "Coinvolgere i cittadini in attività di co-design e valutazione d'efficacia.",
  ],
  [
    "Obiettivo 6",
    "Produrre un impatto concreto e misurabile in termini di sostenibilità e sicurezza.",
  ],
];

const correlati = [
  "mobility-as-a-service-for-italy",
  "maas-for-italy-pubblicato-il-white-paper-sul-primo-programma-nazionale-di-mobilita-come-servizio",
  "maas-for-italy-chiude-la-sperimentazione-oltre-1-milione-di-viaggi-per-una-nuova",
];

const contenuto = dastDocument([
  {
    type: "block",
    item: blocco("article_intro", {
      title: "Introduzione",
      paragraph:
        "Veicoli che dialogano con la strada e con gli altri mezzi: grazie al progetto **MaaS for Italy**, a Milano e Torino la mobilità di domani si prova in città.",
      topics_title: "Argomenti",
      topics: ["Innovazione", "Smart mobility", "Living Lab", "MaaS"].map(
        idTag,
      ),
      details: [
        blocco("intro_detail", {
          label: "Di cosa si tratta",
          paragraph:
            "Misura del Dipartimento per sperimentare in Italia la mobilità come servizio, che integra trasporto pubblico e servizi di mobilità in un'unica esperienza digitale.",
        }),
        blocco("intro_detail", {
          label: "I risultati raggiunti",
          paragraph:
            "Hanno aderito 6 città, 6 Regioni e 1 Provincia autonoma. Due di queste città, Milano e Torino, hanno ospitato i Living Lab.",
        }),
      ],
    }),
  },

  headingNode("In breve", 2),
  ...markdownToDastNodes(
    "La misura MaaS for Italy sviluppa nuovi servizi di mobilità basati sul paradigma della «mobilità come servizio» e attiva due laboratori di sperimentazione per testare soluzioni innovative di trasporto cittadino. Milano e Torino ospitano i due Living Lab, dedicati alla Cooperative, Connected and Automated Mobility (CCAM), la mobilità autonoma, connessa e cooperativa.",
  ),
  {
    type: "block",
    item: blocco("list_blockquote", {
      items: [
        blocco("blockquote", {
          paragraph:
            "Un ecosistema di innovazione aperto, incentrato sugli utenti e basato su un approccio sistematico di co-creazione con gli utenti stessi, che integra processi di ricerca e innovazione in condizioni reali.",
          author: "European Network of Living Labs",
        }),
      ],
    }),
  },

  headingNode("Il progetto", 2),
  ...markdownToDastNodes(
    "Un living lab è uno spazio fisico in cui si sviluppano servizi sperimentali e si applicano tecnologie innovative. Funziona grazie alla collaborazione tra gli attori coinvolti, alla diffusione costante dei risultati e al rafforzamento del trasferimento tecnologico.\n\nTre concetti chiave stanno alla base di un living lab:",
  ),
  {
    type: "block",
    item: blocco("ordered_list", {
      items: vociOrdinate.map(([title, paragraph]) =>
        blocco("list_item", { title, paragraph }),
      ),
    }),
  },

  headingNode("Il focus sperimentale", 2),
  ...markdownToDastNodes(
    "La CCAM è uno dei principali trend del futuro dell'industria automobilistica. Si basa su un sistema di trasporto automatizzato e connesso: le auto comunicano tra loro e con l'infrastruttura stradale, scambiano informazioni e arrivano a guidare in modo autonomo.\n\nLo scambio di informazioni permette di coordinare gli elementi del sistema di trasporto, che possono così prendere le decisioni giuste e adattarsi di volta in volta alle diverse situazioni.\n\nLa CCAM punta a quattro risultati, in sintonia con il MaaS:\n\n- migliorare la sicurezza stradale;\n- ridurre il traffico veicolare e l'inquinamento che ne deriva;\n- rendere più efficiente il trasporto urbano;\n- migliorare il comfort di guida.",
  ),

  headingNode("Gli obiettivi dei Living Lab", 2),
  ...markdownToDastNodes(
    "Il Living Lab è il contesto ideale in cui immaginare, prototipare e testare servizi innovativi, che in futuro potranno entrare in MaaS for Italy e, più in generale, nel paradigma della mobilità come servizio.\n\nÈ a tutti gli effetti una sperimentazione nella sperimentazione, che Milano e Torino conducono in sinergia con la visione generale della misura, impegnandosi su sei fronti:",
  ),
  {
    type: "block",
    item: blocco("list_card_info", {
      items: obiettivi.map(([title, paragraph]) =>
        blocco("list_item", { title, paragraph }),
      ),
    }),
  },

  {
    type: "block",
    item: blocco("related_article", {
      related_block: blocco("article_list", {
        related_articles: correlati.map((slug) => {
          const record = perSlug(slug);
          return blocco("menu_article_item", {
            label: titoloDi(record).trim(),
            points_to: record.id,
          });
        }),
      }),
    }),
  },
]);

const payload = {
  item_type: { id: idPer.article, type: "item_type" },
  article_type: "focus",
  title: { [LOCALE]: "Approfondimento MaaS" },
  slug: { [LOCALE]: SLUG },
  paragraph: { [LOCALE]: "I laboratori per la mobilità del futuro" },
  description: { [LOCALE]: "I laboratori per la mobilità del futuro" },
  description_title: { [LOCALE]: "" },
  image: { [LOCALE]: { upload_id: IMMAGINE } },
  date_shown: "2025-12-17T00:00:00+01:00",
  show_sidebar: false,
  undersecretary: false,
  parent_page: { [LOCALE]: null },
  tags: ["Innovazione", "Smart mobility", "Living Lab", "MaaS"].map(idTag),
  content: { [LOCALE]: contenuto },
};

console.log(COMMIT ? `scrittura su ${TARGET_ENV}` : "DRY-RUN (usa --commit)");
console.log(`blocchi nel contenuto: ${contenuto.document.children.length}`);
console.log(`correlati: ${correlati.join(", ")}`);
console.log(
  esistente ? `record esistente ${esistente.id}: AGGIORNO` : "record: CREO",
);

if (COMMIT) {
  const item = esistente
    ? await to.items.update(esistente.id, payload)
    : await to.items.create(payload);
  await to.items.publish(item.id);
  console.log(`pubblicato ${item.id} → /it/novita/focus/${SLUG}`);
}
