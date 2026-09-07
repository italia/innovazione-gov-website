import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const card = itemTypes.find(
    (itemType) => itemType.api_key === "wide_link_card",
  );
  const article = itemTypes.find((itemType) => itemType.api_key === "article");
  if (!card || !article)
    throw new Error("modelli wide_link_card o article non trovati");

  const fields = await client.fields.list(card.id);

  if (fields.some((field) => field.api_key === "article")) {
    console.log("`article` già presente su `wide_link_card`");
    return;
  }

  console.log(
    'Create Link field "Articolo collegato" (`article`) in block "Card collegamento" (`wide_link_card`)',
  );
  await client.fields.create(card.id, {
    label: "Articolo collegato",
    api_key: "article",
    field_type: "link",
    validators: { item_item_type: { item_types: [article.id] } },
    hint: "Scegliendo un articolo, la card usa il suo titolo, testo, immagine, argomento e data. I campi qui sotto restano come sovrascrittura.",
    appearance: { addons: [], editor: "link_select", parameters: {} },
    position: 1,
  });
}
