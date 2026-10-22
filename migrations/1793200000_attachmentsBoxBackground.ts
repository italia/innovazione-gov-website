import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const blocco = itemTypes.find(
    (itemType) => itemType.api_key === "attachments_box",
  );
  if (!blocco) throw new Error("modello attachments_box non trovato");

  const campi = await client.fields.list(blocco.id);
  if (campi.some((field) => field.api_key === "background_color")) return;

  console.log(
    'Create String field "Background color" in block "Attachments box"',
  );
  await client.fields.create(blocco.id, {
    label: "Background color",
    api_key: "background_color",
    field_type: "string",
    hint: "Con lo sfondo bianco il riquadro sparisce: l'elenco resta allineato al testo, senza padding.",
    default_value: "primary",
    appearance: {
      addons: [],
      editor: "SEKZYn5iRdWsSRZfVcxUmw",
      parameters: {
        collection: '{\n  "extends": [\n    "backgroundColors"\n  ]\n}',
      },
      field_extension: "visualSelect",
    },
    position: campi.length + 1,
  });
}
