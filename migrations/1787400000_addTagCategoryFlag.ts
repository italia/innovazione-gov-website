import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const tag = itemTypes.find((itemType) => itemType.api_key === "tag");
  if (!tag) throw new Error("modello tag non trovato");

  const fields = await client.fields.list(tag.id);
  if (fields.some((field) => field.api_key === "is_category")) {
    console.log("`is_category` già presente sul modello tag");
    return;
  }

  console.log(
    'Create Boolean field "Usa come categoria nei filtri" (`is_category`) in model "Tag" (`tag`)',
  );
  await client.fields.create(tag.id, {
    label: "Usa come categoria nei filtri",
    api_key: "is_category",
    field_type: "boolean",
    hint: "I tag marcati compaiono nel filtro per categoria dei blocchi elenco.",
    appearance: { addons: [], editor: "boolean", parameters: {} },
    default_value: false,
  });
}
