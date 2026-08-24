import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const byApiKey = Object.fromEntries(
    itemTypes.map((itemType) => [itemType.api_key, itemType.id]),
  );

  console.log(
    'Create Links field "Attachments" (`attachments`) in model "Articoli e sottopagine" (`insight`)',
  );
  await client.fields.create(byApiKey.insight, {
    label: "Attachments",
    field_type: "links",
    api_key: "attachments",
    validators: {
      items_item_type: {
        on_publish_with_unpublished_references_strategy: "fail",
        on_reference_unpublish_strategy: "delete_references",
        on_reference_delete_strategy: "delete_references",
        item_types: [byApiKey.attachment],
      },
    },
    appearance: { addons: [], editor: "links_select", parameters: {} },
  });

  console.log(
    'Create Links field "Links" (`links`) in model "Articoli e sottopagine" (`insight`)',
  );
  await client.fields.create(byApiKey.insight, {
    label: "Links",
    field_type: "links",
    api_key: "links",
    validators: {
      items_item_type: {
        on_publish_with_unpublished_references_strategy: "fail",
        on_reference_unpublish_strategy: "delete_references",
        on_reference_delete_strategy: "delete_references",
        item_types: [byApiKey.link_external],
      },
    },
    appearance: { addons: [], editor: "links_select", parameters: {} },
  });
}
