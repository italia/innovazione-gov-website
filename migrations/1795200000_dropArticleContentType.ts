import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const article = itemTypes.find((itemType) => itemType.api_key === "article");
  if (!article) throw new Error("modello article non trovato");

  const fields = await client.fields.list(article.id);
  const contentType = fields.find((field) => field.api_key === "content_type");

  if (!contentType) {
    console.log("`content_type` non è presente sul modello article");
    return;
  }

  console.log(
    'Destroy String field "Tipologia" (`content_type`) in model `article`',
  );
  await client.fields.destroy(contentType.id);
}
