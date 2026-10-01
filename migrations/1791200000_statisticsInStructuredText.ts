import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const structuredText = itemTypes.find(
    (itemType) => itemType.api_key === "structured_text",
  );
  const statisticBlock = itemTypes.find(
    (itemType) => itemType.api_key === "statistic_block",
  );
  if (!structuredText || !statisticBlock)
    throw new Error("modelli structured_text o statistic_block non trovati");

  const campo = (await client.fields.list(structuredText.id)).find(
    (field) => field.api_key === "content",
  );
  if (!campo) throw new Error("campo content non trovato");

  const validators = campo.validators;
  const ammessi =
    "structured_text_blocks" in validators &&
    Array.isArray(validators.structured_text_blocks?.item_types)
      ? validators.structured_text_blocks.item_types
      : [];
  if (ammessi.includes(statisticBlock.id)) return;

  console.log(
    'Update Structured text field "content" (`content`) in block "Testo strutturato" (`structured_text`) to accept the statistics block',
  );
  const inline =
    "structured_text_inline_blocks" in validators
      ? validators.structured_text_inline_blocks
      : { item_types: [] };
  const links =
    "structured_text_links" in validators
      ? validators.structured_text_links
      : { item_types: [] };

  await client.fields.update(campo.id, {
    validators: {
      structured_text_blocks: { item_types: [...ammessi, statisticBlock.id] },
      structured_text_inline_blocks: inline,
      structured_text_links: links,
    },
  });
}
