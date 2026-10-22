import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const blocco = itemTypes.find(
    (itemType) => itemType.api_key === "card_link_list",
  );
  if (!blocco) throw new Error("modello card_link_list non trovato");

  const campi = await client.fields.list(blocco.id);

  if (!campi.some((field) => field.api_key === "cards_count")) {
    console.log(
      'Create Integer field "Quante schede" in block "Card link list"',
    );
    await client.fields.create(blocco.id, {
      label: "Quante schede",
      api_key: "cards_count",
      field_type: "integer",
      hint: "Lascialo vuoto per il comportamento standard (3 schede, tutte quando c'è un filtro o una categoria). Scrivi 0 per mostrarle tutte, oppure il numero esatto che vuoi.",
      validators: { number_range: { min: 0 } },
      appearance: { addons: [], editor: "integer", parameters: {} },
      position: campi.length + 1,
    });
  }
}
