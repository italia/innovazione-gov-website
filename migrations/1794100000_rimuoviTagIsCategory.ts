import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const tag = itemTypes.find((itemType) => itemType.api_key === "tag");
  if (!tag) throw new Error("modello tag non trovato");

  const campo = (await client.fields.list(tag.id)).find(
    (field) => field.api_key === "is_category",
  );
  if (!campo) {
    console.log("`is_category` già rimosso dal modello tag");
    return;
  }

  console.log(
    'Destroy Boolean field "Usa come categoria nei filtri" (`is_category`) of model "Tag" (`tag`)',
  );
  await client.fields.destroy(campo.id);
}
