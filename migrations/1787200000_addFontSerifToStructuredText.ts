import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const structuredText = itemTypes.find(
    (itemType) => itemType.api_key === "structured_text",
  );
  if (!structuredText) throw new Error("modello structured_text non trovato");

  console.log(
    'Create Boolean field "Corpo del testo con font serif" (`font_serif`) in block "Structured text" (`structured_text`)',
  );
  await client.fields.create(structuredText.id, {
    label: "Corpo del testo con font serif",
    api_key: "font_serif",
    field_type: "boolean",
    hint: "Rende i paragrafi in Lora con spaziatura verticale più ampia, per i testi lunghi di lettura.",
    appearance: { addons: [], editor: "boolean", parameters: {} },
    default_value: false,
  });
}
