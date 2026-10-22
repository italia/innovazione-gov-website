import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const article = itemTypes.find((itemType) => itemType.api_key === "article");
  if (!article) throw new Error("modello article non trovato");

  const campi = await client.fields.list(article.id);
  const esiste = (apiKey: string) =>
    campi.some((field) => field.api_key === apiKey);
  let posizione = campi.length + 1;

  if (!esiste("archived")) {
    console.log('Create Boolean field "Attività conclusa" in model "Article"');
    await client.fields.create(article.id, {
      label: "Attività conclusa",
      api_key: "archived",
      field_type: "boolean",
      hint: "Solo per le attività (progetti). Accendilo quando l'attività è terminata: esce dagli elenchi delle attività in corso, entra nell'archivio e la pagina mostra la durata e le attività collegate.",
      appearance: { addons: [], editor: "boolean", parameters: {} },
      position: posizione++,
    });
  }

  if (!esiste("duration")) {
    console.log('Create Single-line string field "Durata" in model "Article"');
    await client.fields.create(article.id, {
      label: "Durata",
      api_key: "duration",
      field_type: "string",
      hint: "Compare solo sulle attività concluse. Scrivila come va letta, per esempio «2020 – 2023» o «marzo 2020 – dicembre 2023».",
      appearance: {
        addons: [],
        editor: "single_line",
        parameters: { heading: false, placeholder: "2020 – 2023" },
      },
      position: posizione++,
    });
  }

  if (!esiste("related_projects")) {
    console.log(
      'Create Multiple links field "Attività collegate" in model "Article"',
    );
    await client.fields.create(article.id, {
      label: "Attività collegate",
      api_key: "related_projects",
      field_type: "links",
      hint: "Altre attività da mostrare in fondo alla pagina quando questa è conclusa.",
      validators: {
        items_item_type: {
          item_types: [article.id],
          on_publish_with_unpublished_references_strategy: "fail",
          on_reference_unpublish_strategy: "delete_references",
          on_reference_delete_strategy: "delete_references",
        },
      },
      appearance: { addons: [], editor: "links_select", parameters: {} },
      position: posizione++,
    });
  }
}
