import { buildClient } from "@datocms/cma-client-node";
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

const val = (campo) => {
  if (!campo || typeof campo !== "object" || Array.isArray(campo))
    return campo ?? null;
  return LOCALE in campo ? (campo[LOCALE] ?? null) : campo;
};

const STORICHE = [
  "identita-digitale-spid-cie",
  "madeit",
  "mobility-as-a-service-for-italy",
  "solidarieta-digitale",
  "banda-ultra-larga",
];

const tipi = await to.itemTypes.list();
const idTipo = (key) => tipi.find((t) => t.api_key === key).id;

const [archivio] = await to.items.list({
  filter: {
    type: idTipo("insight"),
    fields: { slug: { eq: "archivio-attivita" } },
  },
  version: "current",
});
if (!archivio) throw new Error("archivio-attivita non trovato");

for (const slug of STORICHE) {
  const [articolo] = await to.items.list({
    filter: { type: idTipo("article"), fields: { slug: { eq: slug } } },
    version: "current",
  });
  if (!articolo) {
    console.log(`${slug.padEnd(34)} non trovato`);
    continue;
  }
  const genitore = val(articolo.parent_page);
  if (genitore === archivio.id) {
    console.log(`${slug.padEnd(34)} già nell'archivio`);
    continue;
  }
  console.log(
    `${slug.padEnd(34)} /attivita/${slug} → /attivita/archivio-attivita/${slug}`,
  );
  if (!COMMIT) continue;
  await to.items.update(articolo.id, {
    parent_page: { [LOCALE]: archivio.id },
  });
  if (articolo.meta.status === "published") await to.items.publish(articolo.id);
}

if (!COMMIT) console.log("\nanteprima: nessuna scrittura");
