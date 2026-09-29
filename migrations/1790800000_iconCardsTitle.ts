import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const listCard = itemTypes.find(
    (itemType) => itemType.api_key === "list_card_editorial_with_icon",
  );
  if (!listCard)
    throw new Error("blocco list_card_editorial_with_icon non trovato");

  const fields = await client.fields.list(listCard.id);
  if (fields.some((field) => field.api_key === "title")) return;

  console.log(
    'Create Single-line string field "Titolo" (`title`) in block "Lista card editoriali con icona" (`list_card_editorial_with_icon`)',
  );
  await client.fields.create(listCard.id, {
    label: "Titolo",
    api_key: "title",
    field_type: "string",
    hint: "L'etichetta sopra le card. Lasciala vuota per non mostrarla.",
    validators: {},
    appearance: {
      addons: [],
      editor: "single_line",
      parameters: { heading: false },
    },
    position: 0,
  });
}
