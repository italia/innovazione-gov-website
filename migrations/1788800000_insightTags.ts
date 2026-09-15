import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const insight = itemTypes.find((itemType) => itemType.api_key === "insight");
  const tag = itemTypes.find((itemType) => itemType.api_key === "tag");
  if (!insight || !tag) throw new Error("modelli insight o tag non trovati");

  const fields = await client.fields.list(insight.id);
  if (fields.some((field) => field.api_key === "tags")) {
    console.log("`tags` già presente sugli insight");
    return;
  }

  const abstract = fields.find((field) => field.api_key === "abstract");

  console.log(
    'Create Links field "Argomenti" (`tags`) in model "Insight" (`insight`)',
  );
  await client.fields.create(insight.id, {
    label: "Argomenti",
    api_key: "tags",
    field_type: "links",
    hint: "Gli argomenti mostrati in cima alla pagina, gli stessi usati da notizie e focus.",
    validators: { items_item_type: { item_types: [tag.id] } },
    appearance: { addons: [], editor: "links_select", parameters: {} },
    position: abstract ? abstract.position + 1 : undefined,
  });
}
