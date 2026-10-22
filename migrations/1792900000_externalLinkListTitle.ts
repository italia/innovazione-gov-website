import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const blocco = itemTypes.find(
    (itemType) => itemType.api_key === "list_external_link",
  );
  if (!blocco) throw new Error("modello list_external_link non trovato");

  const campi = await client.fields.list(blocco.id);
  if (campi.some((field) => field.api_key === "title")) return;

  console.log(
    'Create Single-line string field "Titolo" in block "List external link"',
  );
  await client.fields.create(blocco.id, {
    label: "Titolo",
    api_key: "title",
    field_type: "string",
    hint: "Opzionale: compare sopra l'elenco, dentro il riquadro. Per esempio «Collegamenti utili».",
    appearance: {
      addons: [],
      editor: "single_line",
      parameters: { heading: false, placeholder: "Collegamenti utili" },
    },
    position: 1,
  });
}
