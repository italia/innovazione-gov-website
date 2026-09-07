import { Client } from "@datocms/cli/lib/cma-client-node";

const readItemTypes = (validators: unknown): string[] | null => {
  if (typeof validators !== "object" || validators === null) return null;
  if (!("item_item_type" in validators)) return null;
  const { item_item_type: candidate } = validators;
  if (typeof candidate !== "object" || candidate === null) return null;
  if (!("item_types" in candidate)) return null;
  const { item_types: types } = candidate;
  if (!Array.isArray(types)) return null;
  return types.every((entry) => typeof entry === "string") ? types : null;
};

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const article = itemTypes.find((itemType) => itemType.api_key === "article");
  const insight = itemTypes.find((itemType) => itemType.api_key === "insight");
  if (!article || !insight)
    throw new Error("modelli article o insight non trovati");

  const fields = await client.fields.list(article.id);
  const parentPage = fields.find((field) => field.api_key === "parent_page");
  if (!parentPage) throw new Error("campo parent_page non trovato");

  const allowed = readItemTypes(parentPage.validators);
  if (!allowed)
    throw new Error("il campo parent_page non espone i tipi ammessi");
  if (allowed.includes(insight.id)) {
    console.log("`insight` già ammesso come genitore di un articolo");
    return;
  }

  console.log(
    'Allow model "Articoli e sottopagine" (`insight`) as parent in field `parent_page` of model "Articolo" (`article`)',
  );
  await client.fields.update(parentPage.id, {
    validators: {
      ...parentPage.validators,
      item_item_type: { item_types: [...allowed, insight.id] },
    },
  });
}
