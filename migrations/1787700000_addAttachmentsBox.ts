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
  const downloadLink = itemTypes.find(
    (itemType) => itemType.api_key === "download_link",
  );
  if (!article || !downloadLink)
    throw new Error("modelli article o download_link non trovati");

  const existing = itemTypes.find(
    (itemType) => itemType.api_key === "attachments_box",
  );
  const block =
    existing ??
    (await client.itemTypes.create({
      name: "Box allegati",
      api_key: "attachments_box",
      modular_block: true,
      hint: "Riquadro blu con titolo e l'elenco dei file da scaricare.",
    }));

  if (!existing) {
    console.log(
      'Create block model "Box allegati" (`attachments_box`) with title and downloads',
    );
    await client.fields.create(block.id, {
      label: "Titolo",
      api_key: "title",
      field_type: "string",
      validators: { required: {} },
      default_value: "Allegati",
      appearance: { addons: [], editor: "single_line", parameters: {} },
    });
    await client.fields.create(block.id, {
      label: "File",
      api_key: "downloads",
      field_type: "rich_text",
      validators: {
        rich_text_blocks: { item_types: [downloadLink.id] },
        size: { min: 1 },
      },
      appearance: {
        addons: [],
        editor: "rich_text",
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
    console.log("`attachments_box` già ammesso nel corpo dell'articolo");
    return;
  }

  console.log(
    'Allow block "Box allegati" (`attachments_box`) in field `content` of model "Articolo" (`article`)',
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
