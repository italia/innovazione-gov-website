import { Client } from "@datocms/cli/lib/cma-client-node";

const HINT =
  "Se la compili sostituisce l'etichetta automatica del contenuto, sia sulle schede sia nei risultati di ricerca. Lasciala vuota per tenere quella calcolata dal sito.";

const MODELLI_NUOVI = ["article", "webinar_item"];
const MODELLI_ESISTENTI = ["page", "insight", "index_page"];

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();

  for (const apiKey of MODELLI_NUOVI) {
    const itemType = itemTypes.find((item) => item.api_key === apiKey);
    if (!itemType) throw new Error(`modello ${apiKey} non trovato`);

    const fields = await client.fields.list(itemType.id);
    if (fields.some((field) => field.api_key === "content_type")) {
      console.log(`\`content_type\` già presente su ${apiKey}`);
      continue;
    }

    const slug = fields.find((field) => field.api_key === "slug");

    console.log(
      `Create String field "Tipologia" (\`content_type\`) in model \`${apiKey}\``,
    );
    await client.fields.create(itemType.id, {
      label: "Tipologia",
      api_key: "content_type",
      field_type: "string",
      hint: HINT,
      appearance: {
        addons: [],
        editor: "single_line",
        parameters: { heading: false },
      },
      position: slug ? slug.position + 1 : fields.length + 1,
    });
  }

  for (const apiKey of MODELLI_ESISTENTI) {
    const itemType = itemTypes.find((item) => item.api_key === apiKey);
    if (!itemType) throw new Error(`modello ${apiKey} non trovato`);

    const fields = await client.fields.list(itemType.id);
    const field = fields.find((item) => item.api_key === "content_type");
    if (!field) throw new Error(`campo content_type non trovato su ${apiKey}`);

    console.log(`Update the hint of \`content_type\` on \`${apiKey}\``);
    await client.fields.update(field.id, { hint: HINT });
  }
}
