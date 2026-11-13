import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const article = itemTypes.find((itemType) => itemType.api_key === "article");
  if (!article) throw new Error("modello article non trovato");

  const fields = await client.fields.list(article.id);

  if (fields.some((field) => field.api_key === "hide_related")) {
    console.log("`hide_related` già presente sul modello article");
    return;
  }

  const relatedArticles = fields.find(
    (field) => field.api_key === "related_articles",
  );
  if (!relatedArticles) throw new Error("campo related_articles non trovato");

  console.log(
    'Create Boolean field "Non mostrare «Potrebbe interessarti»" (`hide_related`) in model "Articolo" (`article`)',
  );
  await client.fields.create(article.id, {
    label: "Non mostrare «Potrebbe interessarti»",
    api_key: "hide_related",
    field_type: "boolean",
    hint: "Toglie dal fondo della pagina il blocco con gli altri contenuti, sia quelli scelti a mano sia quelli composti in automatico.",
    appearance: { addons: [], editor: "boolean", parameters: {} },
    position: relatedArticles.position + 1,
  });
}
