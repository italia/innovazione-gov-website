import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const article = itemTypes.find((itemType) => itemType.api_key === "article");
  if (!article) throw new Error("modello article non trovato");

  const fields = await client.fields.list(article.id);

  const relatedProjects = fields.find(
    (field) => field.api_key === "related_projects",
  );
  if (!relatedProjects) throw new Error("campo related_projects non trovato");

  console.log(
    'Update the hint of Links field "Attività collegate" (`related_projects`)',
  );
  await client.fields.update(relatedProjects.id, {
    hint: "Compaiono in cima alla pagina, sotto il titolo, solo sulle attività concluse.",
  });

  if (fields.some((field) => field.api_key === "related_articles")) {
    console.log("`related_articles` già presente sul modello article");
    return;
  }

  console.log(
    'Create Links field "Potrebbe interessarti" (`related_articles`) in model "Articolo" (`article`)',
  );
  await client.fields.create(article.id, {
    label: "Potrebbe interessarti",
    api_key: "related_articles",
    field_type: "links",
    hint: "Fino a 3 contenuti da mostrare in fondo alla pagina: possono essere notizie, comunicati, focus o attività. Se lasci il campo vuoto li sceglie il sito, fra quelli dello stesso tipo con più argomenti in comune.",
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
      size: { max: 3 },
    },
    position: relatedProjects.position + 1,
  });
}
