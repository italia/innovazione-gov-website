import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const insight = itemTypes.find((itemType) => itemType.api_key === "insight");
  const target = itemTypes.find((itemType) => itemType.api_key === "target");
  if (!insight || !target)
    throw new Error("modelli insight o target non trovati");

  const fields = await client.fields.list(insight.id);
  if (fields.some((field) => field.api_key === "targets")) {
    console.log("`targets` già presente sugli insight");
    return;
  }

  console.log(
    'Create Links field "A chi si rivolge" (`targets`) in model "Insight" (`insight`)',
  );
  await client.fields.create(insight.id, {
    label: "A chi si rivolge",
    api_key: "targets",
    field_type: "links",
    hint: "Cittadini, imprese, Pubblica Amministrazione, stampa: compaiono come argomenti in cima alla pagina.",
    validators: { items_item_type: { item_types: [target.id] } },
    appearance: { addons: [], editor: "links_select", parameters: {} },
  });
}
