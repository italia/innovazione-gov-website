import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();

  const blocco = itemTypes.find(
    (itemType) => itemType.api_key === "topics_block",
  );
  if (!blocco) throw new Error('Block "topics_block" not found');

  const tag = itemTypes.find((itemType) => itemType.api_key === "tag");
  if (!tag) throw new Error('Model "tag" not found');

  const fields = await client.fields.list(blocco.id);
  const topics = fields.find((field) => field.api_key === "topics");
  if (!topics) throw new Error('Field "topics_block.topics" not found');

  const validators = topics.validators as {
    items_item_type: { item_types: string[] };
  };

  if (validators.items_item_type.item_types.includes(tag.id)) {
    console.log('Field "topics_block.topics" already points to "tag"');
    return;
  }

  console.log('Point "topics_block.topics" to "tag"');
  await client.fields.update(topics.id, {
    validators: {
      ...validators,
      items_item_type: {
        ...validators.items_item_type,
        item_types: [tag.id],
      },
    },
  });
}
