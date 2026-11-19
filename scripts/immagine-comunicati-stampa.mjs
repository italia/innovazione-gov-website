import { buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const TARGET_ENV = "website-astro-2026";
const FILENAME = "comunicato-stampa-card.png";
const commit = process.argv.includes("--commit");
const percorsoImmagine = process.argv.find((a) => a.endsWith(".png"));

if (!percorsoImmagine) {
  throw new Error("passare il percorso del PNG da caricare come argomento");
}

const to = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: TARGET_ENV,
  requestTimeout: 120000,
});

const site = await to.site.find();
const locales = site.locales;
const perLocale = (valore) =>
  Object.fromEntries(locales.map((locale) => [locale, valore]));
const metadatiDecorativi = {
  alt: perLocale(""),
  title: perLocale(null),
  custom_data: perLocale({}),
  focal_point: null,
};

const tipi = await to.itemTypes.list();
const article = tipi.find((t) => t.api_key === "article");
if (!article) throw new Error("modello `article` non trovato");

let uploadId = null;
for await (const u of to.uploads.listPagedIterator({
  filter: {
    fields: { filename: { matches: { pattern: "comunicato-stampa" } } },
  },
})) {
  if (u.filename === FILENAME) uploadId = u.id;
}

if (uploadId) {
  console.log(`upload già presente: ${uploadId}`);
} else if (commit) {
  const nuovo = await to.uploads.createFromLocalFile({
    localPath: percorsoImmagine,
    filename: FILENAME,
    default_field_metadata: metadatiDecorativi,
    skipCreationIfAlreadyExists: true,
  });
  uploadId = nuovo.id;
  console.log(`upload creato: ${uploadId} (${nuovo.width}x${nuovo.height})`);
}

const comunicati = [];
for await (const r of to.items.listPagedIterator({
  filter: {
    type: article.id,
    fields: { article_type: { eq: "press_release" } },
  },
  version: "current",
})) {
  comunicati.push(r);
}

const valoreImmagine = (id, localiDelRecord) =>
  Object.fromEntries(
    localiDelRecord.map((locale) => [
      locale,
      {
        upload_id: id,
        alt: "",
        title: null,
        custom_data: {},
        focal_point: null,
      },
    ]),
  );

let assegnati = 0;
let saltati = 0;
for (const r of comunicati) {
  if (r.image?.it?.upload_id || r.image?.en?.upload_id) {
    saltati += 1;
    continue;
  }
  if (!commit || !uploadId) continue;

  const localiDelRecord = locales.filter((locale) => r.title?.[locale] != null);
  await to.items.update(r.id, {
    image: valoreImmagine(uploadId, localiDelRecord),
  });
  if (r.meta.status === "published") await to.items.publish(r.id);
  assegnati += 1;
}

console.log(
  commit
    ? `comunicati: ${comunicati.length} | immagine assegnata: ${assegnati} | già con immagine: ${saltati}`
    : `--- anteprima --- comunicati: ${comunicati.length} | da aggiornare: ${comunicati.length - saltati} | già con immagine: ${saltati}`,
);
