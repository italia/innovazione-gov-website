import { buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";
import { headingNode } from "./lib/markdown-to-dast.mjs";

dotenv.config({ path: ".env" });

const TARGET_ENV = "website-astro-2026";
const LOCALE = "it";
const COMMIT = process.argv.includes("--commit");

const to = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: TARGET_ENV,
  requestTimeout: 120000,
});

const tipi = await to.itemTypes.list();
const chiave = Object.fromEntries(tipi.map((t) => [t.id, t.api_key]));
const idTipo = (key) => tipi.find((t) => t.api_key === key).id;

const TITOLI = {
  download_link: "Allegati",
  list_external_link: "Collegamenti utili",
};

const tipoDelBlocco = (nodo) => {
  const id =
    nodo?.item?.relationships?.item_type?.data?.id ?? nodo?.item?.__itemTypeId;
  return id ? chiave[id] : null;
};

const titoloPrecedente = (figli, indice) => {
  for (let i = indice - 1; i >= 0; i -= 1) {
    const nodo = figli[i];
    if (nodo.type === "heading")
      return nodo.children
        ?.map((c) => c.value ?? "")
        .join("")
        .trim();
    if (nodo.type !== "block") return null;
  }
  return null;
};

function conTitoli(figli) {
  const risultato = [];
  const gruppiVisti = new Set();
  figli.forEach((nodo, indice) => {
    const tipo = nodo.type === "block" ? tipoDelBlocco(nodo) : null;
    const titolo = tipo ? TITOLI[tipo] : null;
    if (titolo && !gruppiVisti.has(titolo)) {
      gruppiVisti.add(titolo);
      if (titoloPrecedente(figli, indice) !== titolo)
        risultato.push(headingNode(titolo, 3));
    }
    risultato.push(nodo);
  });
  return risultato;
}

let toccate = 0,
  invariate = 0;
const posizioni = [];
for await (const r of to.items.listPagedIterator({
  filter: { type: idTipo("job_position") },
  version: "current",
  nested: true,
}))
  posizioni.push(r);

for (const posizione of posizioni) {
  const contenuto = posizione.content?.[LOCALE] ?? [];
  const blocco = contenuto.find(
    (b) => chiave[b.relationships.item_type.data.id] === "structured_text",
  );
  if (!blocco) {
    invariate += 1;
    continue;
  }
  const documento = blocco.attributes.content?.document;
  if (!documento) {
    invariate += 1;
    continue;
  }

  const nuoviFigli = conTitoli(documento.children ?? []);
  if (nuoviFigli.length === (documento.children ?? []).length) {
    invariate += 1;
    continue;
  }

  toccate += 1;
  console.log(
    `${(posizione.slug?.[LOCALE] ?? "").slice(0, 52).padEnd(54)} +${nuoviFigli.length - documento.children.length} titoli`,
  );
  if (!COMMIT) continue;

  const aggiornato = contenuto.map((b) =>
    b.id === blocco.id
      ? {
          id: b.id,
          type: "item",
          attributes: {
            ...b.attributes,
            content: {
              schema: "dast",
              document: { type: "root", children: nuoviFigli },
            },
          },
          relationships: {
            item_type: {
              data: { id: idTipo("structured_text"), type: "item_type" },
            },
          },
        }
      : b.id,
  );
  await to.items.update(posizione.id, { content: { [LOCALE]: aggiornato } });
  await to.items.publish(posizione.id);
}

console.log(`\nda aggiornare ${toccate} | già a posto ${invariate}`);
if (!COMMIT) console.log("anteprima: nessuna scrittura");
