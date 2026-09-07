import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const cardLinkList = itemTypes.find(
    (itemType) => itemType.api_key === "card_link_list",
  );
  if (!cardLinkList) throw new Error("blocco card_link_list non trovato");
  const tag = itemTypes.find((itemType) => itemType.api_key === "tag");
  if (!tag) throw new Error("modello tag non trovato");

  const fields = await client.fields.list(cardLinkList.id);
  if (fields.some((field) => field.api_key === "category")) {
    console.log("`category` già presente su card_link_list");
    return;
  }

  console.log(
    'Create Link field "Mostra solo una categoria" (`category`) in block "Card link list" (`card_link_list`)',
  );
  await client.fields.create(cardLinkList.id, {
    label: "Mostra solo una categoria",
    api_key: "category",
    field_type: "link",
    hint: "Con una categoria selezionata l'elenco mostra tutti gli elementi che la contengono e il filtro non compare.",
    validators: { item_item_type: { item_types: [tag.id] } },
    appearance: { addons: [], editor: "link_select", parameters: {} },
  });
}
