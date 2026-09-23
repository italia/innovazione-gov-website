import { buildBlockRecord, buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";
import { headingNode } from "./lib/markdown-to-dast.mjs";

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
const elenco = (campo) => {
  const v = val(campo) ?? campo;
  return Array.isArray(v) ? v : [];
};

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

const testoDelNodo = (nodo) => {
  if (!nodo) return "";
  if (Array.isArray(nodo)) return nodo.map(testoDelNodo).join(" ");
  if (nodo.type === "span") return nodo.value ?? "";
  return testoDelNodo(nodo.children ?? []);
};

const PROGETTI = ["reti-ultraveloci", "banda-ultra-larga"];

for (const slug of PROGETTI) {
  const [sorgente] = await from.items.list({
    filter: { type: idSorgente("project"), fields: { slug: { eq: slug } } },
    version: "current",
    nested: true,
  });
  const [articolo] = await to.items.list({
    filter: { type: idTarget("article"), fields: { slug: { eq: slug } } },
    version: "current",
    nested: true,
  });
  if (!sorgente || !articolo) {
    console.log(`${slug}: non trovato`);
    continue;
  }

  const documento = val(articolo.content)?.document;
  if (!documento) {
    console.log(`${slug}: nessun testo nell'articolo`);
    continue;
  }

  const gruppi = [];
  let titoloCorrente = "";
  for (const b of elenco(sorgente.content_blocks)) {
    const tipo = chiaveSorgente[b.relationships.item_type.data.id];
    if (tipo === "block_body_text") {
      titoloCorrente = testo(b.attributes.text_title);
      continue;
    }
    if (tipo !== "block_accordion") continue;
    const voci = [];
    for (const idVoce of b.attributes.accordion_items ?? []) {
      const voce = await from.items.find(idVoce, { version: "current" });
      const intestazione = testo(
        val(voce.accordion_item_title) ?? val(voce.title),
      );
      const corpo = testo(val(voce.accordion_item_body_text) ?? val(voce.body));
      if (!intestazione && !corpo) continue;
      voci.push({ intestazione, corpo });
    }
    if (voci.length) gruppi.push({ titolo: titoloCorrente, voci });
  }

  const chiaveTarget = Object.fromEntries(
    tipiTarget.map((t) => [t.id, t.api_key]),
  );
  const vociGiaPresenti = new Set();
  for (const nodo of documento.children ?? []) {
    if (nodo.type !== "block") continue;
    const tipo =
      chiaveTarget[
        nodo.item?.relationships?.item_type?.data?.id ?? nodo.item?.__itemTypeId
      ];
    if (tipo !== "accordion_block") continue;
    for (const voce of nodo.item?.attributes?.accordion?.attributes?.items ??
      []) {
      vociGiaPresenti.add(testo(voce.attributes?.header).toLowerCase());
    }
  }
  const testoAttuale = testoDelNodo(documento.children ?? []).toLowerCase();
  const daAggiungere = gruppi.filter(
    (g) =>
      !g.voci.every(
        (v) =>
          vociGiaPresenti.has(v.intestazione.toLowerCase()) ||
          testoAttuale.includes(v.intestazione.toLowerCase().slice(0, 24)),
      ),
  );

  if (!daAggiungere.length) {
    console.log(`${slug.padEnd(20)} già completo`);
    continue;
  }

  console.log(
    `${slug.padEnd(20)} ${daAggiungere.length} gruppi da recuperare: ${daAggiungere.map((g) => `${g.titolo || "senza titolo"} (${g.voci.length} voci)`).join(", ")}`,
  );
  if (!COMMIT) continue;

  const nuoviNodi = [];
  for (const gruppo of daAggiungere) {
    if (gruppo.titolo) nuoviNodi.push(headingNode(gruppo.titolo, 3));
    nuoviNodi.push({
      type: "block",
      item: blocco("accordion_block", {
        title: "",
        accordion: blocco("accordion", {
          items: gruppo.voci.map((v) =>
            blocco("accordion_item", { header: v.intestazione, body: v.corpo }),
          ),
        }),
      }),
    });
  }

  await to.items.update(articolo.id, {
    content: {
      [LOCALE]: {
        schema: "dast",
        document: {
          type: "root",
          children: [...documento.children, ...nuoviNodi],
        },
      },
    },
  });
  if (articolo.meta.status === "published") await to.items.publish(articolo.id);
}

if (!COMMIT) console.log("\nanteprima: nessuna scrittura");
