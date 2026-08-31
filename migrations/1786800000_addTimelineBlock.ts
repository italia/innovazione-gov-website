import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const byApiKey = Object.fromEntries(
    itemTypes.map((itemType) => [itemType.api_key, itemType.id]),
  );

  console.log('Create block model "Timeline item" (`timeline_item`)');
  const timelineItem = await client.itemTypes.create(
    {
      name: "Timeline item",
      api_key: "timeline_item",
      modular_block: true,
      draft_saving_active: false,
      hint: "Singola tappa della timeline",
      inverse_relationships_enabled: false,
    },
    { skip_menu_item_creation: true },
  );

  await client.fields.create(timelineItem, {
    label: "Periodo",
    api_key: "period",
    field_type: "string",
    hint: 'Etichetta della tappa, es. "Oggi", "2026", "2016-2019"',
    validators: { required: {} },
    appearance: {
      addons: [],
      editor: "single_line",
      parameters: { heading: false, placeholder: null },
    },
  });

  await client.fields.create(timelineItem, {
    label: "Titolo",
    api_key: "title",
    field_type: "string",
    validators: { required: {} },
    appearance: {
      addons: [],
      editor: "single_line",
      parameters: { heading: false, placeholder: null },
    },
  });

  await client.fields.create(timelineItem, {
    label: "Testo",
    api_key: "paragraph",
    field_type: "text",
    validators: {},
    appearance: {
      addons: [],
      editor: "markdown",
      parameters: {
        toolbar: [
          "bold",
          "italic",
          "strikethrough",
          "unordered_list",
          "ordered_list",
          "quote",
          "link",
        ],
      },
    },
  });

  await client.fields.create(timelineItem, {
    label: "Immagine",
    api_key: "image",
    field_type: "file",
    validators: { required_alt_title: { title: false, alt: true } },
    appearance: { addons: [], editor: "file", parameters: {} },
  });

  await client.fields.create(timelineItem, {
    label: "Link",
    api_key: "cta",
    field_type: "single_block",
    validators: {
      single_block_blocks: {
        item_types: [byApiKey.internal_link, byApiKey.external_link],
      },
    },
    appearance: {
      addons: [],
      editor: "framed_single_block",
      parameters: { start_collapsed: false },
    },
  });

  console.log('Create block model "Timeline" (`timeline`)');
  const timeline = await client.itemTypes.create(
    {
      name: "Timeline",
      api_key: "timeline",
      modular_block: true,
      draft_saving_active: false,
      hint: "Testo introduttivo e tappe in ordine cronologico",
      inverse_relationships_enabled: false,
    },
    { skip_menu_item_creation: true },
  );

  await client.fields.create(timeline, {
    label: "Titolo",
    api_key: "title",
    field_type: "string",
    validators: { required: {} },
    appearance: {
      addons: [],
      editor: "single_line",
      parameters: { heading: false, placeholder: null },
    },
  });

  await client.fields.create(timeline, {
    label: "Testo",
    api_key: "paragraph",
    field_type: "text",
    validators: {},
    appearance: {
      addons: [],
      editor: "markdown",
      parameters: {
        toolbar: ["bold", "italic", "unordered_list", "ordered_list", "link"],
      },
    },
  });

  await client.fields.create(timeline, {
    label: "Tappe",
    api_key: "items",
    field_type: "rich_text",
    validators: {
      rich_text_blocks: { item_types: [timelineItem.id] },
      size: { min: 1 },
    },
    appearance: {
      addons: [],
      editor: "rich_text",
      parameters: { start_collapsed: false },
    },
  });

  console.log(
    'Add "Timeline" to the Content of "Articoli e sottopagine" (`insight`)',
  );
  const insightContent = (await client.fields.list(byApiKey.insight)).find(
    (field) => field.api_key === "content",
  );
  if (!insightContent) throw new Error("insight.content non trovato");
  if (!hasRichTextBlocks(insightContent.validators))
    throw new Error("insight.content senza validator rich_text_blocks");

  await client.fields.update(insightContent.id, {
    validators: {
      ...insightContent.validators,
      rich_text_blocks: {
        item_types: [
          ...insightContent.validators.rich_text_blocks.item_types,
          timeline.id,
        ],
      },
    },
  });
}

function hasRichTextBlocks(
  validators: unknown,
): validators is { rich_text_blocks: { item_types: string[] } } {
  return (
    !!validators &&
    typeof validators === "object" &&
    "rich_text_blocks" in validators
  );
}
