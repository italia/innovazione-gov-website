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
  const article = itemTypes.find((itemType) => itemType.api_key === "article");
  const accordionBlock = itemTypes.find(
    (itemType) => itemType.api_key === "accordion_block",
  );
  if (!article || !accordionBlock)
    throw new Error("modelli article o accordion_block non trovati");

  const fields = await client.fields.list(article.id);
  const content = fields.find((field) => field.api_key === "content");
  if (!content) throw new Error("campo content non trovato su article");

  const allowed = readItemTypes(content.validators, "structured_text_blocks");
  const inlineBlocks = readItemTypes(
    content.validators,
    "structured_text_inline_blocks",
  );
  const links = readItemTypes(content.validators, "structured_text_links");
  if (!allowed || !inlineBlocks || !links)
    throw new Error("il campo content non espone i blocchi ammessi");
  if (allowed.includes(accordionBlock.id)) {
    console.log("`accordion_block` già ammesso negli articoli");
    return;
  }

  console.log("Allow `accordion_block` in `article.content`");
  await client.fields.update(content.id, {
    validators: {
      structured_text_blocks: {
        item_types: [...allowed, accordionBlock.id],
      },
      structured_text_inline_blocks: { item_types: inlineBlocks },
      structured_text_links: { item_types: links },
    },
  });
}
