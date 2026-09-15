import { Client } from "@datocms/cli/lib/cma-client-node";

const BLOCCHI_DI_SEZIONE = [
  "text_statistic",
  "text_only",
  "text_image",
  "text_accordion",
  "card_link_list",
  "timeline",
];

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();

  for (const apiKey of BLOCCHI_DI_SEZIONE) {
    const block = itemTypes.find((itemType) => itemType.api_key === apiKey);
    if (!block) continue;

    const fields = await client.fields.list(block.id);
    if (fields.some((field) => field.api_key === "menu_label")) {
      console.log(`\`menu_label\` già presente su ${apiKey}`);
      continue;
    }

    console.log(
      `Create String field "Voce dell'indice" (\`menu_label\`) in block \`${apiKey}\``,
    );
    await client.fields.create(block.id, {
      label: "Voce dell'indice",
      api_key: "menu_label",
      field_type: "string",
      hint: "Se compilata, la sezione compare nell'indice della pagina con questo nome. Se nessuna sezione la compila, l'indice elenca i titoli.",
      validators: {},
      appearance: {
        addons: [],
        editor: "single_line",
        parameters: { heading: false },
      },
    });
  }
}
