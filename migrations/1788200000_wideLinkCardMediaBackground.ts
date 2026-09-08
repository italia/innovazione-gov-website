import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const card = itemTypes.find(
    (itemType) => itemType.api_key === "wide_link_card",
  );
  if (!card) throw new Error("blocco wide_link_card non trovato");

  const fields = await client.fields.list(card.id);
  if (fields.some((field) => field.api_key === "image_background")) {
    console.log("`image_background` già presente su wide_link_card");
    return;
  }

  const image = fields.find((field) => field.api_key === "image");

  console.log(
    'Create String field "Sfondo dell\'immagine" (`image_background`) in block "Card collegamento" (`wide_link_card`)',
  );
  await client.fields.create(card.id, {
    label: "Sfondo dell'immagine",
    api_key: "image_background",
    field_type: "string",
    hint: "Blu per i loghi bianchi, chiaro per i loghi a colori: un logo blu su fondo blu non si vede.",
    validators: { enum: { values: ["chiaro", "blu"] } },
    appearance: {
      addons: [],
      editor: "string_radio_group",
      parameters: {
        radios: [
          { hint: "", label: "Chiaro", value: "chiaro" },
          { hint: "", label: "Blu", value: "blu" },
        ],
      },
    },
    default_value: "chiaro",
    position: image ? image.position + 1 : undefined,
  });
}
