import {
  Client,
  type StructuredTextFieldValidators,
} from "@datocms/cli/lib/cma-client-node";

function accettaBlocchi(
  validators: object,
): validators is StructuredTextFieldValidators {
  return "structured_text_blocks" in validators;
}

const LINKABLE_MODELS = ["page", "article", "insight", "index_page"];

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const idDi = (apiKey: string) => {
    const itemType = itemTypes.find((item) => item.api_key === apiKey);
    if (!itemType) throw new Error(`item type ${apiKey} non trovato`);
    return itemType.id;
  };

  const creaSeManca = async (
    itemTypeId: string,
    apiKey: string,
    corpo: Parameters<Client["fields"]["create"]>[1],
  ) => {
    const esistenti = await client.fields.list(itemTypeId);
    if (esistenti.some((field) => field.api_key === apiKey)) {
      console.log(`\`${apiKey}\` già presente`);
      return;
    }
    console.log(`Create field \`${apiKey}\``);
    await client.fields.create(itemTypeId, corpo);
  };

  let button = itemTypes.find((itemType) => itemType.api_key === "cta_button");

  if (!button) {
    console.log('Create block model "Bottone" (`cta_button`)');
    button = await client.itemTypes.create({
      name: "Bottone",
      api_key: "cta_button",
      modular_block: true,
    });
  }

  await creaSeManca(button.id, "label", {
    label: "Etichetta",
    api_key: "label",
    field_type: "string",
    hint: "Il testo scritto dentro al bottone.",
    validators: { required: {} },
    appearance: {
      addons: [],
      editor: "single_line",
      parameters: { heading: false },
    },
    position: 1,
  });

  await creaSeManca(button.id, "link", {
    label: "Pagina del sito",
    api_key: "link",
    field_type: "link",
    hint: "Lascia vuoto se il bottone porta fuori dal sito.",
    validators: {
      item_item_type: {
        on_publish_with_unpublished_references_strategy: "fail",
        on_reference_unpublish_strategy: "delete_references",
        item_types: LINKABLE_MODELS.map(idDi),
      },
    },
    appearance: { addons: [], editor: "link_select", parameters: {} },
    position: 2,
  });

  await creaSeManca(button.id, "external_url", {
    label: "Indirizzo esterno",
    api_key: "external_url",
    field_type: "string",
    hint: "Usato solo se non hai scelto una pagina del sito. Il bottone mostra l'icona del link esterno.",
    validators: { format: { predefined_pattern: "url" } },
    appearance: {
      addons: [],
      editor: "single_line",
      parameters: { heading: false },
    },
    position: 3,
  });

  await creaSeManca(button.id, "style", {
    label: "Aspetto",
    api_key: "style",
    field_type: "string",
    default_value: "primary",
    validators: { required: {}, enum: { values: ["primary", "outline"] } },
    appearance: {
      addons: [],
      editor: "string_select",
      parameters: {
        options: [
          { label: "Pieno", value: "primary" },
          { label: "Contornato", value: "outline" },
        ],
      },
    },
    position: 4,
  });

  let group = itemTypes.find(
    (itemType) => itemType.api_key === "cta_button_group",
  );

  if (!group) {
    console.log('Create block model "Bottoni" (`cta_button_group`)');
    group = await client.itemTypes.create({
      name: "Bottoni",
      api_key: "cta_button_group",
      modular_block: true,
    });
  }

  await creaSeManca(group.id, "buttons", {
    label: "Bottoni",
    api_key: "buttons",
    field_type: "rich_text",
    hint: "Uno o due bottoni, affiancati sullo schermo largo.",
    validators: {
      rich_text_blocks: { item_types: [button.id] },
      size: { min: 1, max: 3 },
    },
    appearance: {
      addons: [],
      editor: "rich_text",
      parameters: { start_collapsed: false },
    },
    position: 1,
  });

  const campiConBottoni: { itemType: string; field: string }[] = [
    { itemType: "structured_text", field: "content" },
    { itemType: "article", field: "content" },
  ];

  for (const posto of campiConBottoni) {
    const fields = await client.fields.list(idDi(posto.itemType));
    const field = fields.find((item) => item.api_key === posto.field);
    if (!field)
      throw new Error(`campo ${posto.itemType}.${posto.field} non trovato`);

    const validators = field.validators;
    if (!accettaBlocchi(validators))
      throw new Error(`${posto.itemType}.${posto.field} non è structured text`);

    if (validators.structured_text_blocks.item_types.includes(group.id)) {
      console.log(
        `\`cta_button_group\` già ammesso in ${posto.itemType}.${posto.field}`,
      );
      continue;
    }

    console.log(
      `Allow \`cta_button_group\` inside ${posto.itemType}.${posto.field}`,
    );
    await client.fields.update(field.id, {
      validators: {
        ...validators,
        structured_text_blocks: {
          item_types: [
            ...validators.structured_text_blocks.item_types,
            group.id,
          ],
        },
      },
    });
  }
}
