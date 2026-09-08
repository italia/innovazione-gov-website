import { buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const TARGET_ENV = "website-astro-2026";
const LOCALE = "it";
const commit = process.argv.includes("--commit");

const SLUG_RINOMINATI = {
  "app-io-cittadinanza-digitale": "app-io",
  "pagamenti-digitali-pagopa": "pagopa",
};

const from = buildClient({
  apiToken: process.env.DATOCMS_FROM_IMPORT,
  requestTimeout: 120000,
});
const to = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: TARGET_ENV,
  requestTimeout: 120000,
});

const tipiSorgente = await from.itemTypes.list();
const project = tipiSorgente.find((t) => t.api_key === "project");
const tipiTarget = await to.itemTypes.list();
const article = tipiTarget.find((t) => t.api_key === "article");

const campoLogo = (await to.fields.list(article.id)).find(
  (f) => f.api_key === "logo",
);
if (!campoLogo)
  throw new Error(
    "il campo `logo` non esiste ancora su article: applicare prima la migration",
  );

const perFilename = new Map();
const trovaInSandbox = async (filename) => {
  if (perFilename.has(filename)) return perFilename.get(filename);
  const radice = filename.replace(/\.[a-z0-9]+$/i, "");
  for await (const u of to.uploads.listPagedIterator({
    filter: { fields: { filename: { matches: { pattern: radice } } } },
  })) {
    if (u.filename === filename) {
      perFilename.set(filename, u.id);
      return u.id;
    }
  }
  return null;
};

const progetti = [];
for await (const r of from.items.listPagedIterator({
  filter: { type: project.id },
  version: "current",
})) {
  const campo = r.image_project_logo?.[LOCALE] ?? r.image_project_logo;
  if (!campo?.upload_id) continue;
  const upload = await from.uploads.find(campo.upload_id);
  const slugSorgente = r.slug?.[LOCALE] ?? r.slug;
  progetti.push({
    slug: SLUG_RINOMINATI[slugSorgente] ?? slugSorgente,
    filename: upload.filename,
    url: upload.url,
    alt: campo.alt ?? upload.default_field_metadata?.[LOCALE]?.alt ?? null,
  });
}

let caricati = 0;
let assegnati = 0;
for (const p of progetti) {
  const [articolo] = await to.items.list({
    filter: { type: article.id, fields: { slug: { eq: p.slug } } },
    version: "current",
  });
  if (!articolo) {
    console.log(`${p.slug.padEnd(46)} ARTICOLO NON TROVATO`);
    continue;
  }
  if (articolo.logo?.[LOCALE]?.upload_id) {
    console.log(`${p.slug.padEnd(46)} logo già presente`);
    continue;
  }

  let uploadId = await trovaInSandbox(p.filename);
  const daCaricare = !uploadId;
  if (daCaricare && commit) {
    const nuovo = await to.uploads.createFromUrl({
      url: p.url,
      filename: p.filename,
      skipCreationIfAlreadyExists: true,
    });
    uploadId = nuovo.id;
    perFilename.set(p.filename, uploadId);
    caricati += 1;
  }

  console.log(
    `${p.slug.padEnd(46)} ${p.filename.padEnd(38)} ${daCaricare ? "caricato" : "riusato"} ${uploadId ?? "(anteprima)"}`,
  );
  if (!commit || !uploadId) continue;

  await to.items.update(articolo.id, {
    logo: {
      [LOCALE]: {
        upload_id: uploadId,
        alt: p.alt,
        title: null,
        custom_data: {},
        focal_point: null,
      },
    },
  });
  if (articolo.meta.status === "published") await to.items.publish(articolo.id);
  assegnati += 1;
}

console.log(
  commit
    ? `\nfile caricati: ${caricati} | loghi assegnati: ${assegnati}`
    : "\n--- anteprima, nessuna modifica ---",
);
