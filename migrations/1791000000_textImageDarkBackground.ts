import { Client } from "@datocms/cli/lib/cma-client-node";

const COLLEZIONE = JSON.stringify({ extends: ["backgroundColors"] }, null, 2);

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const textImage = itemTypes.find(
    (itemType) => itemType.api_key === "text_image",
  );
  if (!textImage) throw new Error("blocco text_image non trovato");

  const campo = (await client.fields.list(textImage.id)).find(
    (field) => field.api_key === "background_color",
  );
  if (!campo) throw new Error("campo background_color non trovato");

  console.log(
    'Update Single-line string field "background_color" in block "Testo e immagine" (`text_image`) with the dark option',
  );
  await client.fields.update(campo.id, {
    appearance: {
      ...campo.appearance,
      parameters: { ...campo.appearance.parameters, collection: COLLEZIONE },
    },
  });
}
