import { Client } from "@datocms/cli/lib/cma-client-node";

const MODELLI = ["page", "insight", "index_page"];

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();

  for (const apiKey of MODELLI) {
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
      hint: "L'etichetta mostrata accanto al titolo nei risultati di ricerca. Serve solo alle pagine che non stanno sotto Sottosegretario, Dipartimento, Attività o Innova con noi.",
      appearance: {
        addons: [],
        editor: "single_line",
        parameters: { heading: false },
      },
      position: slug ? slug.position + 1 : fields.length + 1,
    });
  }
}
