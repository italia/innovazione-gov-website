import { buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const COMMIT = process.argv.includes("--commit");

const client = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: "website-astro-2026",
  requestTimeout: 60000,
});

const tipi = await client.itemTypes.list();
const idPer = Object.fromEntries(tipi.map((t) => [t.api_key, t.id]));
const apiKeyDi = (b) =>
  tipi.find(
    (t) => t.id === (b.relationships?.item_type?.data?.id ?? b.__itemTypeId),
  )?.api_key;

const nomeTag = new Map();
for await (const t of client.items.listPagedIterator({
  filter: { type: idPer.tag },
  version: "current",
}))
  nomeTag.set(t.id, t.name?.it ?? t.name);

const tagDellArea = new Map();
const titoloArea = new Map();
for (const tipo of ["insight", "page"]) {
  for await (const pagina of client.items.listPagedIterator({
    filter: { type: idPer[tipo] },
    version: "current",
    nested: "true",
  })) {
    for (const blocco of pagina.content?.it ?? []) {
      if (apiKeyDi(blocco) !== "card_link_list") continue;
      const attributi = blocco.attributes ?? blocco;
      if (attributi.last_items !== "project" || !attributi.category) continue;
      tagDellArea.set(pagina.id, attributi.category);
      titoloArea.set(pagina.id, pagina.title?.it ?? pagina.title);
    }
  }
}

console.log("### aree con un elenco di attività filtrato per tag");
for (const [idPagina, idTag] of tagDellArea)
  console.log(`  ${titoloArea.get(idPagina)} → tag "${nomeTag.get(idTag)}"`);

const CONFINE = new Date(
  process.env.CONFINE_TAG ?? "2026-10-21T00:00:00+02:00",
);

const tagDiPrima = async (progetto) => {
  const versioni = await client.itemVersions.list(progetto.id, {
    page: { limit: 30 },
  });
  const precedenti = versioni
    .map((v) => ({
      id: v.id,
      quando: new Date(v.meta?.created_at ?? v.created_at),
    }))
    .filter((v) => v.quando < CONFINE)
    .sort((a, b) => b.quando - a.quando);
  if (precedenti.length === 0) return null;
  const dettaglio = await client.itemVersions.find(precedenti[0].id);
  return { tags: dettaglio.tags ?? [], quando: precedenti[0].quando };
};

const daSistemare = [];
const senzaArea = [];
for await (const progetto of client.items.listPagedIterator({
  filter: { type: idPer.article, fields: { article_type: { eq: "project" } } },
  version: "current",
})) {
  const genitore = progetto.parent_page?.it ?? progetto.parent_page;
  const tagArea = tagDellArea.get(genitore);
  const titolo = progetto.title?.it ?? progetto.title;
  const attuali = new Set(progetto.tags ?? []);
  const prima = await tagDiPrima(progetto);
  const mancanti = (prima?.tags ?? []).filter((id) => !attuali.has(id));
  if (tagArea && !attuali.has(tagArea) && !mancanti.includes(tagArea))
    mancanti.push(tagArea);
  if (!tagArea) senzaArea.push(titolo);
  if (mancanti.length === 0) continue;
  daSistemare.push({
    progetto,
    titolo,
    mancanti,
    quando: prima?.quando ?? null,
  });
}

console.log(`\n### attività con tag da ripristinare: ${daSistemare.length}`);
for (const { titolo, mancanti, quando } of daSistemare)
  console.log(
    `  ${titolo} → ${mancanti.map((id) => `"${nomeTag.get(id)}"`).join(", ")}${quando ? ` (stato del ${quando.toISOString().slice(0, 10)})` : ""}`,
  );
console.log(
  `\n### attività fuori da un'area con elenco filtrato: ${senzaArea.length}`,
);
for (const titolo of senzaArea) console.log(`  ${titolo}`);

if (!COMMIT) {
  console.log("\nDRY-RUN (usa --commit)");
  process.exit(0);
}

for (const { progetto, titolo, mancanti } of daSistemare) {
  await client.items.update(progetto.id, {
    tags: [...(progetto.tags ?? []), ...mancanti],
  });
  if (progetto.meta.status === "published")
    await client.items.publish(progetto.id);
  console.log(`aggiornata: ${titolo}`);
}
console.log("fatto");
