import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const blocco = itemTypes.find(
    (itemType) => itemType.api_key === "card_link_list",
  );
  if (!blocco) throw new Error("modello card_link_list non trovato");

  const campi = await client.fields.list(blocco.id);
  if (campi.some((field) => field.api_key === "only_archived")) return;

  console.log(
    'Create Boolean field "Solo attività concluse" in block "Card link list"',
  );
  await client.fields.create(blocco.id, {
    label: "Solo attività concluse",
    api_key: "only_archived",
    field_type: "boolean",
    hint: "Vale quando l'elenco è di attività: mostra quelle archiviate invece di quelle in corso.",
    appearance: { addons: [], editor: "boolean", parameters: {} },
    position: campi.length + 1,
  });
}
