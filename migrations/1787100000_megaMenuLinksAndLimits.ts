import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const byApiKey = Object.fromEntries(
    itemTypes.map((itemType) => [itemType.api_key, itemType.id]),
  );

  const linkableModels = [
    byApiKey.page,
    byApiKey.homepage,
    byApiKey.index_page,
    byApiKey.insight,
    byApiKey.article,
  ].filter(Boolean);

  for (const blockApiKey of ["menu_item", "mega_menu_item"]) {
    const pointsTo = (await client.fields.list(byApiKey[blockApiKey])).find(
      (field) => field.api_key === "points_to",
    );
    if (!pointsTo) throw new Error(`${blockApiKey}.points_to non trovato`);

    console.log(
      `Allow sottopagine e articoli in ${blockApiKey}.points_to (aggiunge insight e article)`,
    );
    await client.fields.update(pointsTo.id, {
      validators: {
        ...pointsTo.validators,
        item_item_type: {
          ...(hasItemItemType(pointsTo.validators)
            ? pointsTo.validators.item_item_type
            : {}),
          item_types: linkableModels,
        },
      },
    });
  }

  const subMenu = (await client.fields.list(byApiKey.mega_menu_item)).find(
    (field) => field.api_key === "sub_menu",
  );
  if (!subMenu) throw new Error("mega_menu_item.sub_menu non trovato");

  console.log("Raise mega_menu_item.sub_menu limit from 6 to 12 voci");
  await client.fields.update(subMenu.id, {
    validators: {
      ...subMenu.validators,
      size: { min: 1, max: 12 },
    },
  });

  console.log("Make mega_menu_item image and caption optional");
  for (const apiKey of ["image", "caption"]) {
    const field = (await client.fields.list(byApiKey.mega_menu_item)).find(
      (candidate) => candidate.api_key === apiKey,
    );
    if (!field) continue;
    await client.fields.update(field.id, {
      validators: withoutRequired(field.validators),
    });
  }
}

function withoutRequired(validators: unknown) {
  if (!validators || typeof validators !== "object") return {};
  return Object.fromEntries(
    Object.entries(validators).filter(([key]) => key !== "required"),
  );
}

function hasItemItemType(
  validators: unknown,
): validators is { item_item_type: Record<string, unknown> } {
  return (
    !!validators &&
    typeof validators === "object" &&
    "item_item_type" in validators
  );
}
