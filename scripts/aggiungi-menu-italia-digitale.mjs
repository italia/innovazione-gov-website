import { buildBlockRecord, buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";

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

const SOTTOPAGINE = ["il-piano", "gli-obiettivi", "attuazione-misure-pnrr"];

const [pagina] = await to.items.list({
  filter: {
    type: idTipo("page"),
    fields: { slug: { eq: "italia-digitale-2026" } },
  },
  version: "current",
  nested: true,
});
if (!pagina) throw new Error("pagina italia-digitale-2026 non trovata");
const contenuto = pagina.content[LOCALE];

const giaPresente = contenuto.find(
  (b) => chiave[b.relationships.item_type.data.id] === "link_menu",
);

const collegamenti = [];
for (const slug of SOTTOPAGINE) {
  const [insight] = await to.items.list({
    filter: { type: idTipo("insight"), fields: { slug: { eq: slug } } },
    version: "current",
  });
  if (!insight) throw new Error(`sottopagina ${slug} non trovata`);
  collegamenti.push(
    buildBlockRecord({
      item_type: { type: "item_type", id: idTipo("internal_link") },
      label: insight.title[LOCALE] ?? insight.title,
      link_to: insight.id,
    }),
  );
  console.log(`link → ${insight.title[LOCALE] ?? insight.title} (${slug})`);
}

const menu = {
  ...(giaPresente ? { id: giaPresente.id } : {}),
  type: "item",
  attributes: {
    title: "Approfondisci",
    background_color: "lighter",
    links: collegamenti,
  },
  relationships: {
    item_type: { data: { id: idTipo("link_menu"), type: "item_type" } },
  },
};

const nuovoContenuto = giaPresente
  ? contenuto.map((b) => (b.id === giaPresente.id ? menu : b.id))
  : [contenuto[0].id, menu, ...contenuto.slice(1).map((b) => b.id)];

if (!COMMIT) {
  console.log(
    `\nanteprima: menu ${giaPresente ? "aggiornato" : "inserito"} in posizione 1 su ${nuovoContenuto.length} blocchi`,
  );
  process.exit(0);
}

await to.items.update(pagina.id, { content: { [LOCALE]: nuovoContenuto } });
await to.items.publish(pagina.id);
console.log(
  `\nmenu ${giaPresente ? "aggiornato" : "inserito"} e pagina pubblicata`,
);
