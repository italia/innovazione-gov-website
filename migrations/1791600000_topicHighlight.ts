import { Client } from "@datocms/cli/lib/cma-client-node";

const CONTENITORI = ["index_page", "page", "search"];

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const topicList = itemTypes.find(
    (itemType) => itemType.api_key === "topic_list",
  );
  if (!topicList) throw new Error("blocco topic_list non trovato");

  const campiElenco = await client.fields.list(topicList.id);
  if (!campiElenco.some((field) => field.api_key === "paragraph")) {
    console.log(
      'Create Text field "Testo introduttivo" (`paragraph`) in block "Elenco argomenti" (`topic_list`)',
    );
    await client.fields.create(topicList.id, {
      label: "Testo introduttivo",
      api_key: "paragraph",
      field_type: "text",
      hint: "Compare sopra all'indice alfabetico. Accetta il grassetto e i collegamenti.",
      appearance: {
        addons: [],
        editor: "markdown",
        parameters: { toolbar: ["bold", "italic", "link"] },
      },
      position: campiElenco.length + 1,
    });
  }

  const esistente = itemTypes.find(
    (itemType) => itemType.api_key === "topic_highlight",
  );
  const evidenza =
    esistente ??
    (await client.itemTypes.create({
      name: "Argomenti in evidenza",
      api_key: "topic_highlight",
      modular_block: true,
      hint: "Le card degli argomenti con più contenuti, scelte in automatico.",
    }));

  if (!esistente) {
    await client.fields.create(evidenza.id, {
      label: "Titolo",
      api_key: "title",
      field_type: "string",
      validators: { required: {} },
      appearance: { addons: [], editor: "single_line", parameters: {} },
      position: 1,
    });
    await client.fields.create(evidenza.id, {
      label: "Numero di card",
      api_key: "cards_count",
      field_type: "integer",
      hint: "Quanti argomenti mostrare. Se lo lasci vuoto ne mostra tre.",
      validators: { number_range: { min: 1, max: 6 } },
      appearance: { addons: [], editor: "integer", parameters: {} },
      position: 2,
    });
    await client.fields.create(evidenza.id, {
      label: "Colore di sfondo",
      api_key: "background_color",
      field_type: "string",
      default_value: "dark",
      validators: {
        enum: { values: ["default", "lighter", "primary", "dark"] },
      },
      appearance: {
        addons: [],
        editor: "string_select",
        parameters: {
          options: [
            { label: "Bianco", value: "default" },
            { label: "Azzurro chiaro", value: "lighter" },
            { label: "Blu", value: "primary" },
            { label: "Blu scuro", value: "dark" },
          ],
        },
      },
      position: 3,
    });
  }

  for (const apiKey of CONTENITORI) {
    const contenitore = itemTypes.find(
      (itemType) => itemType.api_key === apiKey,
    );
    if (!contenitore) continue;
    const campo = (await client.fields.list(contenitore.id)).find(
      (field) => field.api_key === "content",
    );
    if (!campo) continue;

    const validators = campo.validators;
    const ammessi =
      "rich_text_blocks" in validators &&
      Array.isArray(validators.rich_text_blocks?.item_types)
        ? validators.rich_text_blocks.item_types
        : [];
    if (ammessi.includes(evidenza.id)) continue;

    console.log(`Allow "topic_highlight" in ${apiKey}.content`);
    await client.fields.update(campo.id, {
      validators: {
        rich_text_blocks: { item_types: [...ammessi, evidenza.id] },
      },
    });
  }
}
