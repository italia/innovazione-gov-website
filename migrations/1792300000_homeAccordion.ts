import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const homepage = itemTypes.find(
    (itemType) => itemType.api_key === "homepage",
  );
  const accordion = itemTypes.find(
    (itemType) => itemType.api_key === "text_accordion",
  );
  if (!homepage || !accordion)
    throw new Error("modelli homepage o text_accordion non trovati");

  const campo = (await client.fields.list(homepage.id)).find(
    (field) => field.api_key === "content",
  );
  if (!campo) throw new Error("campo content della homepage non trovato");

  const validators = campo.validators;
  const ammessi =
    "rich_text_blocks" in validators &&
    Array.isArray(validators.rich_text_blocks?.item_types)
      ? validators.rich_text_blocks.item_types
      : [];
  if (ammessi.includes(accordion.id)) return;

  console.log('Allow "text_accordion" in homepage.content');
  await client.fields.update(campo.id, {
    validators: {
      rich_text_blocks: { item_types: [...ammessi, accordion.id] },
    },
  });
}
