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
  const article = itemTypes.find((itemType) => itemType.api_key === "article");
  const linkBlock = itemTypes.find(
    (itemType) => itemType.api_key === "link_block",
  );
  if (!article || !linkBlock)
    throw new Error("modelli article o link_block non trovati");

  const existing = itemTypes.find(
    (itemType) => itemType.api_key === "wide_link_card",
  );
  const block =
    existing ??
    (await client.itemTypes.create({
      name: "Card collegamento",
      api_key: "wide_link_card",
      modular_block: true,
      hint: "Card orizzontale con immagine, titolo, descrizione e categoria: per i collegamenti utili nel corpo del testo.",
    }));

  if (!existing) {
    console.log(
      'Create block model "Card collegamento" (`wide_link_card`) with image, title, paragraph, category and link',
    );
    await client.fields.create(block.id, {
      label: "Immagine",
      api_key: "image",
      field_type: "file",
      validators: {},
      appearance: { addons: [], editor: "file", parameters: {} },
    });
    await client.fields.create(block.id, {
      label: "Titolo",
      api_key: "title",
      field_type: "string",
      validators: {},
      appearance: { addons: [], editor: "single_line", parameters: {} },
    });
    await client.fields.create(block.id, {
      label: "Descrizione",
      api_key: "paragraph",
      field_type: "text",
      validators: {},
      appearance: {
        addons: [],
        editor: "textarea",
        parameters: { placeholder: null },
      },
    });
    await client.fields.create(block.id, {
      label: "Categoria",
      api_key: "category",
      field_type: "string",
      validators: {},
      appearance: { addons: [], editor: "single_line", parameters: {} },
    });
    await client.fields.create(block.id, {
      label: "Collegamento",
      api_key: "link",
      field_type: "single_block",
      validators: {
        single_block_blocks: { item_types: [linkBlock.id] },
      },
      appearance: {
        addons: [],
        editor: "framed_single_block",
        parameters: { start_collapsed: false },
      },
    });
  }

  const fields = await client.fields.list(article.id);
  const content = fields.find((field) => field.api_key === "content");
  if (!content) throw new Error("campo content non trovato su article");
  const allowed = readItemTypes(content.validators, "structured_text_blocks");
  if (!allowed)
    throw new Error("il campo content non espone i blocchi ammessi");
  if (allowed.includes(block.id)) {
    console.log("`wide_link_card` già ammesso nel corpo dell'articolo");
    return;
  }

  console.log(
    'Allow block "Card collegamento" (`wide_link_card`) in field `content` of model "Articolo" (`article`)',
  );
  await client.fields.update(content.id, {
    validators: {
      structured_text_blocks: { item_types: [...allowed, block.id] },
      structured_text_inline_blocks: {
        item_types:
          readItemTypes(content.validators, "structured_text_inline_blocks") ??
          [],
      },
      structured_text_links: {
        item_types:
          readItemTypes(content.validators, "structured_text_links") ?? [],
      },
    },
  });
}
