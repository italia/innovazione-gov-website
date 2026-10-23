import { buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const TARGET_ENV = "website-astro-2026";
const PLUGIN_VISUAL_SELECT = "SEKZYn5iRdWsSRZfVcxUmw";
const CARTELLA = process.argv[2];
const COMMIT = process.argv.includes("--commit");

const NOMI = {
  "bandiera.svg": "Bandiera (bianca)",
  "spunta.svg": "Spunta",
  "tre-persone.svg": "Tre persone",
  "interoperabilita.svg": "Interoperabilità",
  "cloud.svg": "Cloud",
  "obiettivo-raggiunto.svg": "Obiettivo raggiunto",
  "livelli.svg": "Livelli",
  "sicurezza.svg": "Sicurezza",
};

const client = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: TARGET_ENV,
  requestTimeout: 60000,
});

const plugin = await client.plugins.find(PLUGIN_VISUAL_SELECT);
const presets = JSON.parse(plugin.parameters.presets);
const iconList = presets.iconList ?? [];

const nuove = [];
for (const [file, name] of Object.entries(NOMI)) {
  if (iconList.some((icona) => icona.name === name)) {
    console.log(`già presente: ${name}`);
    continue;
  }
  if (!COMMIT) {
    nuove.push(name);
    continue;
  }
  const upload = await client.uploads.createFromLocalFile({
    localPath: `${CARTELLA}/${file}`,
    filename: file,
    default_field_metadata: {
      it: { alt: name, title: name, custom_data: {} },
      en: { alt: name, title: name, custom_data: {} },
    },
  });
  const url = upload.url;
  iconList.push({ name, type: "image", display: url, value: url });
  nuove.push(`${name} → ${url}`);
  console.log(`caricata: ${name} → ${url}`);
}

if (!COMMIT) {
  console.log("DRY-RUN (usa --commit)");
  console.log(`icone già in lista: ${iconList.length}`);
  console.log(`da aggiungere: ${nuove.join(", ") || "nessuna"}`);
  process.exit(0);
}

await client.plugins.update(PLUGIN_VISUAL_SELECT, {
  parameters: {
    ...plugin.parameters,
    presets: JSON.stringify({ ...presets, iconList }),
  },
});

console.log(`iconList aggiornata: ${iconList.length} icone`);
