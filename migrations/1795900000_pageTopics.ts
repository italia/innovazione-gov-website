import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const page = itemTypes.find((itemType) => itemType.api_key === "page");
  if (!page) throw new Error("modello page non trovato");
  const tag = itemTypes.find((itemType) => itemType.api_key === "tag");
  if (!tag) throw new Error("modello tag non trovato");

  const fields = await client.fields.list(page.id);
  if (fields.some((field) => field.api_key === "tags")) {
    console.log("`tags` già presente su page");
    return;
  }

  const seo = fields.find((field) => field.api_key === "seo");
  const posizione = seo ? seo.position : fields.length;

  console.log(
    'Create Links field "Argomenti" (`tags`) in model "Page" (`page`)',
  );
  await client.fields.create(page.id, {
    label: "Argomenti",
    api_key: "tags",
    field_type: "links",
    hint: "Classificazione interna, non compare sulla pagina.",
    validators: {
      items_item_type: {
        item_types: [tag.id],
        on_publish_with_unpublished_references_strategy: "fail",
        on_reference_unpublish_strategy: "delete_references",
        on_reference_delete_strategy: "delete_references",
      },
    },
    appearance: { addons: [], editor: "links_select", parameters: {} },
    position: posizione,
  });
}
