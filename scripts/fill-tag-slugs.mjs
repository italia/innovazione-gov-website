import { buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const COMMIT = process.argv.includes("--commit");
const to = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: "website-astro-2026",
  requestTimeout: 120000,
});

const slugify = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const tipi = await to.itemTypes.list();
const tag = tipi.find((t) => t.api_key === "tag").id;

const tags = [];
for await (const r of to.items.listPagedIterator({
  filter: { type: tag },
  version: "current",
}))
  tags.push(r);

const presi = new Set(tags.map((t) => (t.slug ?? "").trim()).filter(Boolean));
let slugAggiunti = 0,
  nomiPuliti = 0;

for (const t of tags) {
  const nome = String(t.name ?? "");
  const nomePulito = nome.trim();
  const slugAttuale = String(t.slug ?? "").trim();
  const modifiche = {};

  if (nomePulito !== nome) {
    modifiche.name = nomePulito;
    nomiPuliti += 1;
  }

  if (!slugAttuale) {
    const base = slugify(nomePulito) || `argomento-${t.id.toLowerCase()}`;
    let candidato = base;
    for (let n = 2; presi.has(candidato); n += 1) candidato = `${base}-${n}`;
    presi.add(candidato);
    modifiche.slug = candidato;
    slugAggiunti += 1;
  }

  if (!Object.keys(modifiche).length) continue;
  console.log(
    `${nomePulito.slice(0, 42).padEnd(44)} ${modifiche.slug ? `slug: ${modifiche.slug}` : ""}${modifiche.name ? "  nome ripulito" : ""}`,
  );
  if (!COMMIT) continue;
  await to.items.update(t.id, modifiche);
  if (t.meta.status === "published") await to.items.publish(t.id);
}

console.log(
  COMMIT
    ? `\nslug aggiunti: ${slugAggiunti} | nomi ripuliti: ${nomiPuliti}`
    : `\n--- anteprima: ${slugAggiunti} slug da aggiungere, ${nomiPuliti} nomi da ripulire ---`,
);
