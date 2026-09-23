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

const tipiSorgente = await from.itemTypes.list();
const tipiTarget = await to.itemTypes.list();
const chiaveTarget = Object.fromEntries(
  tipiTarget.map((t) => [t.id, t.api_key]),
);
const idSorgente = (key) => tipiSorgente.find((t) => t.api_key === key)?.id;
const idTarget = (key) => tipiTarget.find((t) => t.api_key === key).id;
const blocco = (key, attributi) =>
  buildBlockRecord({
    item_type: { type: "item_type", id: idTarget(key) },
    ...attributi,
  });

const titoloInGrassetto = (testoTitolo, livello) => ({
  type: "heading",
  level: livello,
  children: [{ type: "span", marks: ["strong"], value: testoTitolo }],
});

const testoDelNodo = (nodo) => {
  if (!nodo) return "";
  if (Array.isArray(nodo)) return nodo.map(testoDelNodo).join(" ");
  if (nodo.type === "span") return nodo.value ?? "";
  return testoDelNodo(nodo.children ?? []);
};

async function sottopaginaSorgente(slug) {
  const [record] = await from.items.list({
    filter: {
      type: idSorgente("department_subpage"),
      fields: { slug: { eq: slug } },
    },
    version: "current",
    nested: true,
  });
  return record;
}

async function insightTarget(slug) {
  const [record] = await to.items.list({
    filter: { type: idTarget("insight"), fields: { slug: { eq: slug } } },
    version: "current",
    nested: true,
  });
  return record;
}

function corpoDelBlocco(sorgente, titolo) {
  for (const b of val(sorgente.content_blocks) ?? []) {
    if (testo(b.attributes.text_title) === titolo)
      return testo(b.attributes.body_text);
  }
  return "";
}

async function salva(insight, contenuto) {
  if (!COMMIT) return;
  await to.items.update(insight.id, { content: { [LOCALE]: contenuto } });
  await to.items.publish(insight.id);
}

function contenutoConBloccoAggiornato(insight, idBlocco, attributi, apiKey) {
  return (val(insight.content) ?? []).map((b) =>
    b.id === idBlocco
      ? {
          id: b.id,
          type: "item",
          attributes: attributi,
          relationships: {
            item_type: { data: { id: idTarget(apiKey), type: "item_type" } },
          },
        }
      : b.id,
  );
}

console.log("## Concessione patrocinio · sezione Criteri");
{
  const sorgente = await sottopaginaSorgente("concessione-patrocinio");
  const insight = await insightTarget("concessione-patrocinio");
  const criteri = corpoDelBlocco(sorgente, "Criteri");
  const blocchi = val(insight.content) ?? [];
  const testoStrutturato = blocchi.find(
    (b) =>
      chiaveTarget[b.relationships.item_type.data.id] === "structured_text",
  );
  const figli = testoStrutturato.attributes.content.document.children;
  const giaPresente = figli.some(
    (n) =>
      n.type === "heading" && testoDelNodo(n.children).trim() === "Criteri",
  );

  if (!criteri) console.log("   testo non trovato nella sorgente");
  else if (giaPresente) console.log("   già presente");
  else {
    const posizione = figli.findIndex(
      (n) =>
        n.type === "heading" &&
        testoDelNodo(n.children).startsWith("Requisiti"),
    );
    const nuovi = [
      titoloInGrassetto("Criteri", 2),
      ...markdownToDastNodes(criteri),
    ];
    const indice = posizione > -1 ? posizione : figli.length;
    const aggiornati = [
      ...figli.slice(0, indice),
      ...nuovi,
      ...figli.slice(indice),
    ];
    console.log(
      `   inserita prima di "${posizione > -1 ? testoDelNodo(figli[posizione].children) : "fine pagina"}" (${nuovi.length} nodi, ${criteri.split(/\s+/).length} parole)`,
    );
    await salva(
      insight,
      contenutoConBloccoAggiornato(
        insight,
        testoStrutturato.id,
        {
          ...testoStrutturato.attributes,
          content: {
            schema: "dast",
            document: { type: "root", children: aggiornati },
          },
        },
        "structured_text",
      ),
    );
  }
}

console.log("\n## Storia e principi · la nostra storia e i numeri");
{
  const sorgente = await sottopaginaSorgente("storia-e-principi");
  const insight = await insightTarget("storia-e-principi");
  const storia = corpoDelBlocco(sorgente, "La nostra storia");
  const blocchi = val(insight.content) ?? [];
  const testoStrutturato = blocchi.find(
    (b) =>
      chiaveTarget[b.relationships.item_type.data.id] === "structured_text",
  );
  const figli = testoStrutturato.attributes.content.document.children;
  const giaPresente = figli.some(
    (n) =>
      n.type === "heading" &&
      testoDelNodo(n.children).trim() === "La nostra storia",
  );

  if (giaPresente) console.log("   racconto già presente");
  else {
    const nuovi = [
      headingNode("La nostra storia", 2),
      ...markdownToDastNodes(storia),
    ];
    console.log(
      `   racconto inserito in testa (${storia.split(/\s+/).length} parole, con i link originali)`,
    );
    await salva(
      insight,
      contenutoConBloccoAggiornato(
        insight,
        testoStrutturato.id,
        {
          ...testoStrutturato.attributes,
          content: {
            schema: "dast",
            document: { type: "root", children: [...nuovi, ...figli] },
          },
        },
        "structured_text",
      ),
    );
  }

  const aggiornato = await insightTarget("storia-e-principi");
  const contenuto = val(aggiornato.content) ?? [];
  const haNumeri = contenuto.some(
    (b) => chiaveTarget[b.relationships.item_type.data.id] === "text_statistic",
  );
  if (haNumeri) console.log("   numeri già presenti");
  else {
    const [pagina] = await from.items.list({
      filter: { type: idSorgente("department_page") },
      version: "current",
    });
    const kpi = [];
    for (const idNumero of pagina.numbers ?? []) {
      const numero = await from.items.find(idNumero, { version: "current" });
      kpi.push({
        valore: testo(val(numero.number)),
        testo: testo(val(numero.text)),
      });
    }
    console.log(
      "   numeri recuperati:",
      kpi.map((k) => `${k.valore} ${k.testo}`).join(" · "),
    );
    if (COMMIT) {
      const idKpi = [];
      for (const k of kpi) {
        const creato = await to.items.create({
          item_type: { type: "item_type", id: idTarget("kpi_element") },
          title: k.testo,
          value: k.valore.replace("%", ""),
          value_suffix: k.valore.includes("%") ? "%" : "",
          value_prefix: "",
          percentage: "",
          footer_text: "",
          show_flow: false,
        });
        await to.items.publish(creato.id);
        idKpi.push(creato.id);
      }
      const sezione = blocco("text_statistic", {
        background_color: "lighter",
        show_inline: true,
        menu_label: "",
        layout: "default",
        image: null,
        text: blocco("text_block", {
          title: "I numeri delle nostre attività",
          paragraph:
            "I dati delle piattaforme nazionali abilitanti, aggiornati al 2022.",
          cta: null,
        }),
        statistics: blocco("statistic_block", {
          statistics: [],
          kpi_element: idKpi,
        }),
      });
      const posizioneTimeline = contenuto.findIndex(
        (b) => chiaveTarget[b.relationships.item_type.data.id] === "timeline",
      );
      const indice =
        posizioneTimeline > -1 ? posizioneTimeline + 1 : contenuto.length;
      const identificativi = contenuto.map((b) => b.id);
      const nuovoContenuto = [
        ...identificativi.slice(0, indice),
        sezione,
        ...identificativi.slice(indice),
      ];
      await to.items.update(aggiornato.id, {
        content: { [LOCALE]: nuovoContenuto },
      });
      await to.items.publish(aggiornato.id);
    }
  }
}

if (!COMMIT) console.log("\nanteprima: nessuna scrittura");
