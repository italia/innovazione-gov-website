import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const article = itemTypes.find((itemType) => itemType.api_key === "article");
  const tag = itemTypes.find((itemType) => itemType.api_key === "tag");
  if (!article || !tag) throw new Error("modelli article o tag non trovati");

  const esistenteVoce = itemTypes.find(
    (itemType) => itemType.api_key === "intro_detail",
  );
  const voce =
    esistenteVoce ??
    (await client.itemTypes.create({
      name: "Voce introduzione",
      api_key: "intro_detail",
      modular_block: true,
      hint: "Una coppia etichetta + testo nella colonna destra dell'introduzione.",
    }));

  if (!esistenteVoce) {
    await client.fields.create(voce.id, {
      label: "Etichetta",
      api_key: "label",
      field_type: "string",
      hint: "Resa in maiuscoletto sopra al testo, per esempio «Di cosa si tratta».",
      validators: { required: {} },
      appearance: { addons: [], editor: "single_line", parameters: {} },
      position: 1,
    });
    await client.fields.create(voce.id, {
      label: "Testo",
      api_key: "paragraph",
      field_type: "text",
      validators: { required: {} },
      appearance: {
        addons: [],
        editor: "markdown",
        parameters: { toolbar: ["bold", "italic", "link"] },
      },
      position: 2,
    });
  }

  const esistenteIntro = itemTypes.find(
    (itemType) => itemType.api_key === "article_intro",
  );
  if (esistenteIntro) return;

  const intro = await client.itemTypes.create({
    name: "Introduzione con argomenti",
    api_key: "article_intro",
    modular_block: true,
    hint: "Due colonne: a sinistra titolo, testo e argomenti; a destra le voci etichetta + testo.",
  });

  await client.fields.create(intro.id, {
    label: "Titolo",
    api_key: "title",
    field_type: "string",
    validators: { required: {} },
    appearance: { addons: [], editor: "single_line", parameters: {} },
    position: 1,
  });

  await client.fields.create(intro.id, {
    label: "Testo",
    api_key: "paragraph",
    field_type: "text",
    appearance: {
      addons: [],
      editor: "markdown",
      parameters: { toolbar: ["bold", "italic", "link"] },
    },
    position: 2,
  });

  await client.fields.create(intro.id, {
    label: "Etichetta degli argomenti",
    api_key: "topics_title",
    field_type: "string",
    hint: "Compare sopra ai chip. Lasciala vuota per non mostrarla.",
    default_value: "Argomenti",
    appearance: { addons: [], editor: "single_line", parameters: {} },
    position: 3,
  });

  await client.fields.create(intro.id, {
    label: "Argomenti",
    api_key: "topics",
    field_type: "links",
    validators: {
      items_item_type: {
        item_types: [tag.id],
        on_publish_with_unpublished_references_strategy: "fail",
        on_reference_unpublish_strategy: "delete_references",
        on_reference_delete_strategy: "delete_references",
      },
    },
    appearance: { addons: [], editor: "links_select", parameters: {} },
    position: 4,
  });

  await client.fields.create(intro.id, {
    label: "Voci",
    api_key: "details",
    field_type: "rich_text",
    hint: "Le coppie etichetta + testo della colonna destra.",
    validators: { rich_text_blocks: { item_types: [voce.id] } },
    appearance: {
      addons: [],
      editor: "rich_text",
      parameters: { start_collapsed: false },
    },
    position: 5,
  });

  const campoContenuto = (await client.fields.list(article.id)).find(
    (field) => field.api_key === "content",
  );
  if (!campoContenuto)
    throw new Error("campo content dell'articolo non trovato");

  const validators = campoContenuto.validators;
  const ammessi =
    "structured_text_blocks" in validators &&
    Array.isArray(validators.structured_text_blocks?.item_types)
      ? validators.structured_text_blocks.item_types
      : [];
  if (ammessi.includes(intro.id)) return;

  const inline =
    "structured_text_inline_blocks" in validators
      ? validators.structured_text_inline_blocks
      : { item_types: [] };
  const links =
    "structured_text_links" in validators
      ? validators.structured_text_links
      : { item_types: [] };

  await client.fields.update(campoContenuto.id, {
    validators: {
      structured_text_blocks: { item_types: [...ammessi, intro.id] },
      structured_text_inline_blocks: inline,
      structured_text_links: links,
    },
  });
}
