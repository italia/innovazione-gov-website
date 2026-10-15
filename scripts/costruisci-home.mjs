import { buildBlockRecord, buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const COMMIT = process.argv.includes("--commit");
const TARGET_ENV = "website-astro-2026";
const LOCALE = "it";

const to = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: TARGET_ENV,
  requestTimeout: 60000,
});

const tipi = await to.itemTypes.list();
const idPer = Object.fromEntries(tipi.map((t) => [t.api_key, t.id]));
const blocco = (apiKey, campi) =>
  buildBlockRecord({
    item_type: { id: idPer[apiKey], type: "item_type" },
    ...campi,
  });

const collegamento = (label, destinazione) =>
  blocco("internal_link", { label, link_to: destinazione });

const PAGINE = {
  dipartimento: "HJocVwHXTYyUij_ReMZX6g",
  attivita: "O-jJWH1XQUCeSKtIV8PT1Q",
  novita: "VEVDAxmpTEygLw8wJl7mcA",
  pnrr: "PUM-f16WRJaPRF9vC_A8Xw",
  misure: "G4U4OKlCR8Ga_kqDtnvlXg",
};

const slugDi = (r) => (typeof r.slug === "object" ? r.slug?.[LOCALE] : r.slug);
const perSlug = new Map();
for await (const r of to.items.listPagedIterator({
  filter: { type: idPer.article },
  version: "current",
}))
  perSlug.set(slugDi(r), r.id);

const trova = (slug) => {
  const id = perSlug.get(slug);
  if (!id) throw new Error(`articolo «${slug}» non trovato`);
  return id;
};

const ID_IT_WALLET = trova(
  "it-wallet-supera-quota-10-milioni-di-attivazioni-su-app-io-17-3-milioni-di-documenti-gia-caricati",
);
const ID_MAAS = trova("living-lab-maas-for-italy");
const ID_FSE = trova("il-fascicolo-sanitario-elettronico-2-0");
const ID_COMITATO = trova(
  "comitato-interministeriale-per-la-transizione-al-digitale",
);

const statistica = (descrizione, numero, icona) =>
  blocco("data_container", {
    title: descrizione,
    info: numero,
    icon_select: icona,
  });

const contenuto = [
  blocco("hero", {
    title: "Guidiamo la trasformazione digitale del Paese",
    paragraph:
      "Il Dipartimento per la trasformazione digitale coordina le strategie, i progetti e le iniziative che accompagnano la modernizzazione della Pubblica Amministrazione e lo sviluppo digitale dell'Italia.",
    variant: "default",
    background_color: "dark",
    show_breadcrumb: false,
    cta: collegamento("Scopri il Dipartimento", PAGINE.dipartimento),
    cta_secondary: collegamento("Esplora le attività", PAGINE.attivita),
  }),

  blocco("highlight_carousel", {
    title: "In primo piano",
    items: [
      blocco("highlight_item", {
        points_to: ID_IT_WALLET,
        label: "Sistema IT-Wallet",
        paragraph:
          "Scopri IT-Wallet, il sistema che rende più semplice l'identità digitale e l'accesso ai documenti e ai servizi pubblici in Italia. Patente di guida, tessera sanitaria, carta europea della disabilità: potrai averli in formato digitale sul tuo smartphone, sempre con te, protetti e facili da consultare.",
      }),
    ],
  }),

  blocco("card_link_list", {
    title: "Le ultime novità",
    last_items: "articles",
    background_color: "lighter",
    show_inline_card: false,
    show_filter_on_category: false,
    cta: collegamento("Esplora tutte le novità", PAGINE.novita),
    list_content: [],
  }),

  blocco("text_accordion", {
    background_color: "default",
    text: blocco("text_block", {
      title: "Approfondimenti",
      paragraph:
        "I temi su cui il Dipartimento sta lavorando, raccontati nel dettaglio.",
      cta: collegamento("Vedi tutti", PAGINE.novita),
    }),
    accordion: blocco("accordion_block", {
      title: "",
      accordion: blocco("accordion", {
        items: [
          blocco("accordion_item", {
            header: "Living Lab MaaS4Italy",
            body: "Il progetto MaaS for Italy, oltre a contribuire allo sviluppo di nuovi servizi per la mobilità basati sul paradigma «Mobilità come Servizio», attiva due laboratori di sperimentazione a Milano e Torino.",
            cta: collegamento("Scopri MaaS for Italy", ID_MAAS),
          }),
          blocco("accordion_item", {
            header: "FSE 2.0",
            body: "Il Fascicolo Sanitario Elettronico 2.0 è il punto di accesso dei cittadini ai servizi del Servizio Sanitario Nazionale.",
            cta: collegamento(
              "Scopri il Fascicolo Sanitario Elettronico",
              ID_FSE,
            ),
          }),
          blocco("accordion_item", {
            header: "Comitato interministeriale per la transizione digitale",
            body: "Il Comitato coordina le politiche di trasformazione digitale del Paese e monitora l'attuazione delle iniziative previste.",
            cta: collegamento("Scopri il Comitato", ID_COMITATO),
          }),
        ],
      }),
    }),
  }),

  blocco("text_image", {
    variant: "variant-1",
    background_color: "lighter",
    heading: "h2",
    text: blocco("text_block", {
      title: "Le attività del dipartimento",
      paragraph:
        "Le strategie del Dipartimento prendono forma in interventi concreti: progetti dedicati a servizi, infrastrutture, competenze e innovazione, collaborazioni internazionali e attività ormai concluse. Un lavoro che accompagna la trasformazione digitale del Paese, in Italia e all'estero.",
      cta: collegamento("Scopri di più", PAGINE.attivita),
    }),
  }),

  blocco("text_statistic", {
    background_color: "dark",
    layout: "default",
    show_inline: false,
    text: blocco("text_block", {
      title: "I risultati del PNRR",
      paragraph:
        "Il Piano Nazionale di Ripresa e Resilienza ha accelerato la trasformazione digitale della Pubblica Amministrazione, rendendo i servizi pubblici sempre più semplici, accessibili e innovativi.",
      cta: collegamento("Scopri i risultati", PAGINE.pnrr),
      cta_secondary: collegamento("Scopri le misure", PAGINE.misure),
    }),
    statistics: blocco("statistic_block", {
      kpi_element: [],
      statistics: [
        statistica(
          "Persone formate ai servizi digitali",
          "oltre 2 milioni",
          "it-user",
        ),
        statistica(
          "Servizi pubblici interoperabili",
          "oltre 13 mila",
          "it-exchange-circle",
        ),
        statistica(
          "PA passate al cloud qualificato",
          "oltre 12 mila",
          "it-software",
        ),
      ],
    }),
  }),

  blocco("text_image", {
    variant: "variant-1",
    background_color: "default",
    heading: "h2",
    text: blocco("text_block", {
      title: "L'ecosistema della trasformazione digitale italiana",
      paragraph:
        "Il Dipartimento coordina un ecosistema di progetti e collaborazioni che accompagna la trasformazione digitale del Paese: dalla definizione delle strategie nazionali alle attività internazionali, fino al monitoraggio dei risultati raggiunti.",
      cta: collegamento("Scopri cosa facciamo", PAGINE.dipartimento),
    }),
  }),

  blocco("text_statistic", {
    background_color: "dark",
    layout: "default",
    show_inline: true,
    text: blocco("text_block", {
      title: "I numeri",
      paragraph:
        "I risultati della trasformazione digitale del Paese in cifre.",
    }),
    statistics: blocco("statistic_block", {
      kpi_element: [],
      statistics: [
        statistica("Obiettivi PNRR raggiunti", "69 su 69", "it-check-circle"),
        statistica(
          "Software condivisi nel catalogo",
          "oltre 500",
          "it-software",
        ),
        statistica(
          "Servizi pubblici resi più sicuri e moderni",
          "oltre 135mila",
          "it-pa",
        ),
      ],
    }),
  }),
];

const home = await to.items.find("KRLlePDjS3Cq4QFUjEc9ig", {
  nested: "true",
  version: "current",
});
const contenutoPerLingua = home.content ?? {};
const lingue = Object.keys(contenutoPerLingua);
const precedenti = (contenutoPerLingua[LOCALE] ?? []).length;
const apiKeyDi = (b) =>
  tipi.find(
    (t) => t.id === (b.relationships?.item_type?.data?.id ?? b.__itemTypeId),
  )?.api_key;

const tabValida = (tab) => (tab.attributes?.news ?? tab.news ?? []).length > 0;

const riparaBlocco = (b) => {
  if (apiKeyDi(b) !== "news_feed") return b.id;
  const attributi = b.attributes ?? b;
  const tabs = (attributi.tabs ?? []).filter(tabValida).map((tab) => tab.id);
  if (tabs.length === (attributi.tabs ?? []).length) return b.id;
  console.log(
    `riparo il blocco news_feed inglese: tolgo ${(attributi.tabs ?? []).length - tabs.length} tab senza contenuti`,
  );
  return buildBlockRecord({
    id: b.id,
    item_type: {
      id: b.relationships?.item_type?.data?.id ?? b.__itemTypeId,
      type: "item_type",
    },
    title: attributi.title,
    paragraph: attributi.paragraph,
    background_color: attributi.background_color,
    cta: attributi.cta?.id ?? attributi.cta ?? null,
    tabs,
  });
};

const altreLingue = Object.fromEntries(
  lingue
    .filter((lingua) => lingua !== LOCALE)
    .map((lingua) => [
      lingua,
      (contenutoPerLingua[lingua] ?? []).map(riparaBlocco),
    ]),
);
const titoliPerLingua = Object.fromEntries(
  Object.entries(home.title ?? {}).map(([lingua, valore]) => [lingua, valore]),
);

console.log(COMMIT ? `scrittura su ${TARGET_ENV}` : "DRY-RUN (usa --commit)");
console.log(`lingue del campo: ${lingue.join(", ")}`);
console.log(`blocchi attuali in home (${LOCALE}): ${precedenti}`);
console.log(`blocchi nuovi: ${contenuto.length}`);

if (!COMMIT) process.exit(0);

const soloIndice = process.argv.indexOf("--solo");
if (soloIndice !== -1) {
  const n = Number(process.argv[soloIndice + 1]);
  for (let i = 0; i < contenuto.length; i += 1) {
    try {
      await to.items.update("KRLlePDjS3Cq4QFUjEc9ig", {
        content: { ...altreLingue, [LOCALE]: [contenuto[i]] },
      });
      console.log(`blocco ${i}: ok`);
    } catch (e) {
      const dettaglio = (e.response?.body?.data ?? [])
        .map(
          (x) =>
            `${x.attributes?.code} ${JSON.stringify(x.attributes?.details ?? {}).slice(0, 160)}`,
        )
        .join(" | ");
      console.log(
        `blocco ${i}: FALLISCE → ${dettaglio || String(e).slice(0, 90)}`,
      );
    }
  }
  process.exit(0);
}

await to.items.update("KRLlePDjS3Cq4QFUjEc9ig", {
  title: {
    ...titoliPerLingua,
    [LOCALE]: "Dipartimento per la trasformazione digitale",
  },
  content: { ...altreLingue, [LOCALE]: contenuto },
});
await to.items.publish("KRLlePDjS3Cq4QFUjEc9ig");
console.log("home aggiornata e pubblicata");
