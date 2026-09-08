import { Client } from "@datocms/cli/lib/cma-client-node";

const readItemTypes = (validators: unknown, key: string): string[] | null => {
  if (typeof validators !== "object" || validators === null) return null;
  if (!(key in validators)) return null;
  const container = Reflect.get(validators, key);
  if (typeof container !== "object" || container === null) return null;
  if (!("item_types" in container)) return null;
  const types = Reflect.get(container, "item_types");
  if (!Array.isArray(types)) return null;
  return types.every((entry) => typeof entry === "string") ? types : null;
};

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const list = itemTypes.find(
    (itemType) => itemType.api_key === "card_link_list",
  );
  const card = itemTypes.find(
    (itemType) => itemType.api_key === "wide_link_card",
  );
  if (!list || !card)
    throw new Error("blocchi card_link_list o wide_link_card non trovati");

  const fields = await client.fields.list(list.id);
  const content = fields.find((field) => field.api_key === "list_content");
  if (!content) throw new Error("campo list_content non trovato");

  const allowed = readItemTypes(content.validators, "rich_text_blocks");
  if (!allowed)
    throw new Error("il campo list_content non espone i blocchi ammessi");
  if (allowed.includes(card.id)) {
    console.log("`wide_link_card` già ammessa in list_content");
    return;
  }

  console.log(
    'Allow block "Card collegamento" (`wide_link_card`) in field `list_content` of block "Elenco card" (`card_link_list`)',
  );
  await client.fields.update(content.id, {
    validators: { rich_text_blocks: { item_types: [...allowed, card.id] } },
  });
}
