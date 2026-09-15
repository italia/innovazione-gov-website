import { Client } from "@datocms/cli/lib/cma-client-node";

const readItemTypes = (validators: unknown, key: string): string[] | null => {
  if (typeof validators !== "object" || validators === null) return null;
  if (!(key in validators)) return null;
  const container = Reflect.get(validators, key);
  if (typeof container !== "object" || container === null) return null;
  if (!("item_types" in container)) return null;
  const types = Reflect.get(container, "item_types");
  if (!Array.isArray(types)) return null;
  return types.every((entry) => typeof entry === "string") ? types : null;
};

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();

  const internalLink = itemTypes.find(
    (itemType) => itemType.api_key === "internal_link",
  );
  const externalLink = itemTypes.find(
    (itemType) => itemType.api_key === "external_link",
  );
  if (!internalLink || !externalLink)
    throw new Error("blocchi internal_link o external_link non trovati");

  let linkMenu = itemTypes.find((itemType) => itemType.api_key === "link_menu");

  if (!linkMenu) {
    console.log('Create block model "Link menu" (`link_menu`)');
    linkMenu = await client.itemTypes.create({
      name: "Link menu",
      api_key: "link_menu",
      modular_block: true,
      collection_appearance: "compact",
      hint: "Elenco di link in cima alla pagina, per raggiungere le pagine collegate.",
    });

    console.log('Create Single-line string field "Titolo" (`title`)');
    await client.fields.create(linkMenu.id, {
      label: "Titolo",
      api_key: "title",
      field_type: "string",
      hint: "Etichetta sopra i link, per esempio «Approfondisci».",
      validators: {},
      appearance: {
        addons: [],
        editor: "single_line",
        parameters: { heading: false },
      },
    });

    console.log('Create Modular content field "Link" (`links`)');
    await client.fields.create(linkMenu.id, {
      label: "Link",
      api_key: "links",
      field_type: "rich_text",
      validators: {
        rich_text_blocks: { item_types: [internalLink.id, externalLink.id] },
        size: { min: 1 },
      },
      appearance: {
        addons: [],
        editor: "rich_text",
        parameters: { start_collapsed: false },
      },
    });

    console.log(
      'Create Single-line string field "Sfondo" (`background_color`)',
    );
    await client.fields.create(linkMenu.id, {
      label: "Sfondo",
      api_key: "background_color",
      field_type: "string",
      default_value: "default",
      validators: { required: {} },
      appearance: {
        addons: [],
        editor: "SEKZYn5iRdWsSRZfVcxUmw",
        parameters: {
          collection: '{\n  "extends": [\n    "backgroundColors"\n  ]\n}',
        },
        field_extension: "visualSelect",
      },
    });
  }

  for (const apiKey of ["page", "insight"]) {
    const model = itemTypes.find((itemType) => itemType.api_key === apiKey);
    if (!model) continue;
    const fields = await client.fields.list(model.id);
    const content = fields.find((field) => field.api_key === "content");
    if (!content) continue;
    const allowed = readItemTypes(content.validators, "rich_text_blocks");
    if (!allowed)
      throw new Error(
        `il campo ${apiKey}.content non espone i blocchi ammessi`,
      );
    if (allowed.includes(linkMenu.id)) {
      console.log(`\`link_menu\` già ammesso in ${apiKey}.content`);
      continue;
    }
    console.log(`Allow \`link_menu\` in \`${apiKey}.content\``);
    await client.fields.update(content.id, {
      validators: {
        rich_text_blocks: { item_types: [...allowed, linkMenu.id] },
      },
    });
  }
}
