import { buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";

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

const SOTTOPAGINE = {
  "cosa-facciamo": "cosa-facciamo",
  "la-struttura": "struttura",
  "storia-e-principi": "storia-e-principi",
  "concessione-patrocinio": "concessione-patrocinio",
};

const tipiSorgente = await from.itemTypes.list();
const tipiTarget = await to.itemTypes.list();
const idSorgente = (key) => tipiSorgente.find((t) => t.api_key === key)?.id;
const idTarget = (key) => tipiTarget.find((t) => t.api_key === key).id;

const tagPerSlug = new Map();
for await (const t of to.items.listPagedIterator({
  filter: { type: idTarget("tag") },
  version: "current",
})) {
  tagPerSlug.set(val(t.slug) ?? t.slug, t.id);
}

const tagCreati = new Set();
async function tagTarget(idTagSorgente) {
  const sorgente = await from.items.find(idTagSorgente, { version: "current" });
  const slug = testo(val(sorgente.slug) ?? sorgente.slug);
  if (!slug) return null;
  if (tagPerSlug.has(slug)) return tagPerSlug.get(slug);
  const nome =
    testo(val(sorgente.name) ?? sorgente.name) ||
    testo(val(sorgente.title)) ||
    slug;
  tagCreati.add(`${slug} (${nome})`);
  if (!COMMIT) return null;
  const creato = await to.items.create({
    item_type: { type: "item_type", id: idTarget("tag") },
    name: nome,
    slug,
    description: "",
    is_category: false,
  });
  await to.items.publish(creato.id);
  tagPerSlug.set(slug, creato.id);
  return creato.id;
}

async function allegatoTarget(idAllegatoSorgente) {
  const sorgente = await from.items.find(idAllegatoSorgente, {
    version: "current",
  });
  const upload = val(sorgente.file)?.upload_id;
  if (!upload) return null;
  const titolo = testo(val(sorgente.file_title)) || "Allegato";
  if (!COMMIT) return { anteprima: titolo };
  const origine = await from.uploads.find(upload);
  const copiato = await to.uploads.createFromUrl({
    url: origine.url,
    filename: origine.filename,
    skipCreationIfAlreadyExists: true,
  });
  const creato = await to.items.create({
    item_type: { type: "item_type", id: idTarget("attachment") },
    file_title: titolo,
    file_description: testo(val(sorgente.file_description)),
    file: { upload_id: copiato.id },
  });
  await to.items.publish(creato.id);
  return { id: creato.id, titolo };
}

for (const [slugSorgente, slugTarget] of Object.entries(SOTTOPAGINE)) {
  const [sorgente] = await from.items.list({
    filter: {
      type: idSorgente("department_subpage"),
      fields: { slug: { eq: slugSorgente } },
    },
    version: "current",
  });
  const [target] = await to.items.list({
    filter: { type: idTarget("insight"), fields: { slug: { eq: slugTarget } } },
    version: "current",
  });
  if (!sorgente || !target) {
    console.log(
      `${slugSorgente}: non trovata (sorgente ${Boolean(sorgente)}, sandbox ${Boolean(target)})`,
    );
    continue;
  }

  const allegatiAttuali = elenco(target.attachments);
  const titoliAttuali = new Set();
  for (const idAllegato of allegatiAttuali) {
    const a = await to.items.find(idAllegato, { version: "current" });
    titoliAttuali.add(testo(val(a.file_title)));
  }

  const nuoviAllegati = [...allegatiAttuali];
  const aggiunti = [];
  for (const idAllegato of elenco(sorgente.attachments)) {
    const sorgenteAllegato = await from.items.find(idAllegato, {
      version: "current",
    });
    const titolo = testo(val(sorgenteAllegato.file_title)) || "Allegato";
    if (titoliAttuali.has(titolo)) continue;
    const creato = await allegatoTarget(idAllegato);
    if (!creato) continue;
    aggiunti.push(creato.titolo ?? creato.anteprima);
    if (creato.id) nuoviAllegati.push(creato.id);
  }

  const argomentiAttuali = elenco(target.tags);
  const nuoviArgomenti = [...argomentiAttuali];
  const argomentiAggiunti = [];
  for (const idTag of elenco(sorgente.tags)) {
    const id = await tagTarget(idTag);
    if (id && !nuoviArgomenti.includes(id)) {
      nuoviArgomenti.push(id);
      argomentiAggiunti.push(id);
    }
  }

  console.log(
    `${slugTarget.padEnd(24)} allegati +${aggiunti.length}${aggiunti.length ? ` (${aggiunti.join("; ").slice(0, 80)})` : ""} | argomenti +${argomentiAggiunti.length}`,
  );

  if (!COMMIT || (!aggiunti.length && !argomentiAggiunti.length)) continue;
  await to.items.update(target.id, {
    attachments: nuoviAllegati,
    tags: nuoviArgomenti,
  });
  await to.items.publish(target.id);
}

if (tagCreati.size) console.log("argomenti creati:", [...tagCreati].join(", "));
if (!COMMIT) console.log("\nanteprima: nessuna scrittura");
