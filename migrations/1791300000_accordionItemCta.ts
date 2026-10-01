import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const accordionItem = itemTypes.find(
    (itemType) => itemType.api_key === "accordion_item",
  );
  const internalLink = itemTypes.find(
    (itemType) => itemType.api_key === "internal_link",
  );
  const externalLink = itemTypes.find(
    (itemType) => itemType.api_key === "external_link",
  );
  if (!accordionItem || !internalLink || !externalLink)
    throw new Error("modelli accordion_item o link non trovati");

  const campi = await client.fields.list(accordionItem.id);
  if (campi.some((field) => field.api_key === "cta")) return;

  console.log(
    'Create Single block field "CTA" (`cta`) in block "Accordion item" (`accordion_item`)',
  );
  await client.fields.create(accordionItem.id, {
    label: "CTA",
    api_key: "cta",
    field_type: "single_block",
    hint: "Un collegamento interno o esterno in fondo alla voce. Lascialo vuoto per non mostrarlo.",
    validators: {
      single_block_blocks: {
        item_types: [internalLink.id, externalLink.id],
      },
    },
    appearance: {
      addons: [],
      editor: "framed_single_block",
      parameters: { start_collapsed: false },
    },
    position: campi.length + 1,
  });
}
