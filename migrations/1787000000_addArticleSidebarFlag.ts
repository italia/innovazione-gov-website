import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const article = itemTypes.find((itemType) => itemType.api_key === "article");
  if (!article) throw new Error("modello article non trovato");

  console.log(
    'Create Boolean field "Mostra sidebar" (`show_sidebar`) in model "Articoli interni" (`article`)',
  );
  await client.fields.create(article.id, {
    label: "Mostra sidebar",
    api_key: "show_sidebar",
    field_type: "boolean",
    hint: "Con la sidebar il testo sta in colonna accanto all'indice della pagina; senza, il contenuto occupa tutta la larghezza.",
    appearance: { addons: [], editor: "boolean", parameters: {} },
    default_value: true,
  });

  console.log("Set show_sidebar on existing articles");
  for await (const item of client.items.listPagedIterator({
    filter: { type: article.id },
    version: "current",
    nested: true,
  })) {
    await client.items.update(item.id, { show_sidebar: true });
    if (item.meta.status !== "draft") await client.items.publish(item.id);
  }
}
