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
  const page = itemTypes.find((itemType) => itemType.api_key === "page");
  const timeline = itemTypes.find(
    (itemType) => itemType.api_key === "timeline",
  );
  if (!page || !timeline)
    throw new Error("modelli page o timeline non trovati");

  const content = (await client.fields.list(page.id)).find(
    (field) => field.api_key === "content",
  );
  if (!content) throw new Error("campo content non trovato su page");

  const allowed = readItemTypes(content.validators, "rich_text_blocks");
  if (!allowed)
    throw new Error("il campo content non espone i blocchi ammessi");
  if (allowed.includes(timeline.id)) {
    console.log("`timeline` già ammessa nelle pagine");
    return;
  }

  console.log(
    'Allow block "Timeline" (`timeline`) in field `content` of model "Pagina" (`page`)',
  );
  await client.fields.update(content.id, {
    validators: { rich_text_blocks: { item_types: [...allowed, timeline.id] } },
  });
}
