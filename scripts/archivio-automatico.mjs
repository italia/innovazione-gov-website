import { buildBlockRecord, buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const COMMIT = process.argv.includes("--commit");
const PAGINA_ARCHIVIO = "BLhVSfscSeuE6BpfW9ljQA";

const client = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: "website-astro-2026",
  requestTimeout: 60000,
});

const tipi = await client.itemTypes.list();
const nome = (id) => tipi.find((t) => t.id === id)?.api_key ?? id;
const tipoDi = (b) => b.relationships?.item_type?.data?.id ?? b.__itemTypeId;

const pagina = await client.items.find(PAGINA_ARCHIVIO, {
  nested: "true",
  version: "current",
});

const contenuto = pagina.content.it.map((b) => {
  if (nome(tipoDi(b)) !== "card_link_list") return b.id;
  return buildBlockRecord({
    id: b.id,
    item_type: { id: tipoDi(b), type: "item_type" },
    ...b.attributes,
    list_content: [],
    last_items: "project",
    only_archived: true,
    show_filter_on_category: true,
    cta: b.attributes.cta?.id ?? null,
  });
});

console.log(COMMIT ? "scrittura" : "DRY-RUN (usa --commit)");
if (!COMMIT) process.exit(0);

await client.items.update(PAGINA_ARCHIVIO, { content: { it: contenuto } });
await client.items.publish(PAGINA_ARCHIVIO);
console.log("archivio attività: elenco automatico delle attività concluse");
