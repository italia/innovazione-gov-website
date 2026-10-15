import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const blocco = itemTypes.find(
    (itemType) => itemType.api_key === "accordion_showcase",
  );
  if (!blocco) throw new Error("modello accordion_showcase non trovato");

  const campi = await client.fields.list(blocco.id);
  if (campi.some((field) => field.api_key === "image")) return;

  console.log('Create File field "Immagine" in block "Approfondimenti"');
  await client.fields.create(blocco.id, {
    label: "Immagine",
    api_key: "image",
    field_type: "file",
    hint: "Compare a destra. Una voce con immagine propria la sostituisce.",
    validators: {
      extension: { predefined_list: "image" },
      required_alt_title: { title: false, alt: true },
    },
    appearance: { addons: [], editor: "file", parameters: {} },
    position: campi.length + 1,
  });
}
