import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const insight = itemTypes.find((itemType) => itemType.api_key === "insight");
  if (!insight) throw new Error("modello insight non trovato");

  const campo = (await client.fields.list(insight.id)).find(
    (field) => field.api_key === "parent_page",
  );
  if (!campo) throw new Error("campo parent_page non trovato");

  const validators = campo.validators;
  const ammessi =
    "item_item_type" in validators &&
    Array.isArray(validators.item_item_type?.item_types)
      ? validators.item_item_type.item_types
      : [];
  if (ammessi.includes(insight.id)) return;

  console.log(
    'Update Single link field "Parent page" (`parent_page`) in model "Sottopagina" (`insight`) to accept another sub page',
  );
  await client.fields.update(campo.id, {
    validators: {
      item_item_type: {
        ...(validators as { item_item_type: Record<string, unknown> })
          .item_item_type,
        item_types: [...ammessi, insight.id],
      },
    },
  });
}
