import { Client } from "@datocms/cli/lib/cma-client-node";

const CONTENITORI = ["homepage", "page", "search"];

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const collegabili = ["article", "page", "insight"]
    .map((apiKey) => itemTypes.find((itemType) => itemType.api_key === apiKey))
    .filter((itemType) => itemType !== undefined);
  if (collegabili.length !== 3)
    throw new Error("modelli article, page o insight non trovati");

  const esistenteVoce = itemTypes.find(
    (itemType) => itemType.api_key === "highlight_item",
  );
  const voce =
    esistenteVoce ??
    (await client.itemTypes.create({
      name: "Contenuto in evidenza",
      api_key: "highlight_item",
      modular_block: true,
      hint: "Un contenuto da mettere in evidenza: notizia, focus, attività, comunicato, pagina o sottopagina.",
    }));

  if (!esistenteVoce) {
    console.log('Create fields in block "Contenuto in evidenza"');
    await client.fields.create(voce.id, {
      label: "Contenuto",
      api_key: "points_to",
      field_type: "link",
      validators: {
        required: {},
        item_item_type: {
          item_types: collegabili.map((itemType) => itemType.id),
          on_publish_with_unpublished_references_strategy: "fail",
          on_reference_unpublish_strategy: "delete_references",
          on_reference_delete_strategy: "delete_references",
        },
      },
      appearance: { addons: [], editor: "link_select", parameters: {} },
      position: 1,
    });
    await client.fields.create(voce.id, {
      label: "Titolo alternativo",
      api_key: "label",
      field_type: "string",
      hint: "Sostituisce il titolo del contenuto collegato. Lascialo vuoto per usare quello originale.",
      appearance: { addons: [], editor: "single_line", parameters: {} },
      position: 2,
    });
  }

  const esistenteCarosello = itemTypes.find(
    (itemType) => itemType.api_key === "highlight_carousel",
  );
  const carosello =
    esistenteCarosello ??
    (await client.itemTypes.create({
      name: "Carosello in evidenza",
      api_key: "highlight_carousel",
      modular_block: true,
      hint: "I contenuti in evidenza, scelti a mano fra notizie, focus, attività e comunicati.",
    }));

  if (!esistenteCarosello) {
    console.log('Create fields in block "Carosello in evidenza"');
    await client.fields.create(carosello.id, {
      label: "Titolo",
      api_key: "title",
      field_type: "string",
      appearance: { addons: [], editor: "single_line", parameters: {} },
      position: 1,
    });
    await client.fields.create(carosello.id, {
      label: "Testo introduttivo",
      api_key: "paragraph",
      field_type: "text",
      appearance: {
        addons: [],
        editor: "markdown",
        parameters: { toolbar: ["bold", "italic", "link"] },
      },
      position: 2,
    });
    await client.fields.create(carosello.id, {
      label: "Contenuti",
      api_key: "items",
      field_type: "rich_text",
      validators: { rich_text_blocks: { item_types: [voce.id] } },
      appearance: {
        addons: [],
        editor: "rich_text",
        parameters: { start_collapsed: true },
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
    if (ammessi.includes(carosello.id)) continue;

    console.log(`Allow "highlight_carousel" in ${apiKey}.content`);
    await client.fields.update(campo.id, {
      validators: {
        rich_text_blocks: { item_types: [...ammessi, carosello.id] },
      },
    });
  }
}
