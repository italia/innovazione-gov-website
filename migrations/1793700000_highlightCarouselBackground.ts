import { Client } from "@datocms/cli/lib/cma-client-node";

const COLLEZIONE = JSON.stringify({ extends: ["backgroundColors"] }, null, 2);

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const carosello = itemTypes.find(
    (itemType) => itemType.api_key === "highlight_carousel",
  );
  if (!carosello) throw new Error("blocco highlight_carousel non trovato");

  const campi = await client.fields.list(carosello.id);
  if (campi.some((field) => field.api_key === "background_color")) return;

  console.log(
    'Create Single-line string field "Sfondo" (`background_color`) in block "Carosello in evidenza"',
  );
  await client.fields.create(carosello.id, {
    label: "Sfondo",
    api_key: "background_color",
    field_type: "string",
    hint: "Il blu è lo stesso della hero: scegli quello se la sezione prende il posto della hero in cima alla pagina.",
    default_value: "default",
    appearance: {
      addons: [],
      editor: "SEKZYn5iRdWsSRZfVcxUmw",
      parameters: { collection: COLLEZIONE },
      field_extension: "visualSelect",
    },
    position: campi.length + 1,
  });
}
