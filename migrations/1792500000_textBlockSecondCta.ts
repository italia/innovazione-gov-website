import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const testo = itemTypes.find((itemType) => itemType.api_key === "text_block");
  const internalLink = itemTypes.find(
    (itemType) => itemType.api_key === "internal_link",
  );
  const externalLink = itemTypes.find(
    (itemType) => itemType.api_key === "external_link",
  );
  if (!testo || !internalLink || !externalLink)
    throw new Error("modelli text_block o link non trovati");

  const campi = await client.fields.list(testo.id);
  if (campi.some((field) => field.api_key === "cta_secondary")) return;

  console.log(
    'Create Single block field "CTA secondaria" in block "Text block"',
  );
  await client.fields.create(testo.id, {
    label: "CTA secondaria",
    api_key: "cta_secondary",
    field_type: "single_block",
    hint: "Un secondo pulsante accanto al primo. Lascialo vuoto per mostrarne uno solo.",
    validators: {
      single_block_blocks: { item_types: [internalLink.id, externalLink.id] },
    },
    appearance: {
      addons: [],
      editor: "framed_single_block",
      parameters: { start_collapsed: true },
    },
    position: campi.length + 1,
  });
}
