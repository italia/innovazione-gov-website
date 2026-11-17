import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const article = itemTypes.find((itemType) => itemType.api_key === "article");
  if (!article) throw new Error("modello article non trovato");

  const fields = await client.fields.list(article.id);

  const relatedArticles = fields.find(
    (field) => field.api_key === "related_articles",
  );
  if (!relatedArticles) throw new Error("campo related_articles non trovato");

  if (!fields.some((field) => field.api_key === "show_related")) {
    console.log(
      'Create Boolean field "Mostra «Potrebbe interessarti»" (`show_related`) in model "Articolo" (`article`)',
    );
    await client.fields.create(article.id, {
      label: "Mostra «Potrebbe interessarti»",
      api_key: "show_related",
      field_type: "boolean",
      hint: "Spento, in fondo alla pagina non compare niente. Acceso, compaiono i focus scelti qui sotto e le altre schede, a mano o in automatico.",
      appearance: { addons: [], editor: "boolean", parameters: {} },
      position: relatedArticles.position,
    });
  }

  if (!fields.some((field) => field.api_key === "related_focus")) {
    console.log(
      'Create Links field "Focus in evidenza" (`related_focus`) in model "Articolo" (`article`)',
    );
    await client.fields.create(article.id, {
      label: "Focus in evidenza",
      api_key: "related_focus",
      field_type: "links",
      hint: "Fino a 2 focus, scelti sempre a mano: aprono il blocco «Potrebbe interessarti» con le schede orizzontali. Lasciando vuoto non compaiono.",
      appearance: {
        addons: [],
        editor: "links_select",
        parameters: { filters: [] },
      },
      validators: {
        items_item_type: {
          on_publish_with_unpublished_references_strategy: "fail",
          on_reference_unpublish_strategy: "delete_references",
          on_reference_delete_strategy: "delete_references",
          item_types: [article.id],
        },
        size: { max: 2 },
      },
      position: relatedArticles.position + 1,
    });
  }

  const hideRelated = fields.find((field) => field.api_key === "hide_related");
  if (hideRelated) {
    console.log('Destroy Boolean field "hide_related"');
    await client.fields.destroy(hideRelated.id);
  }
}
