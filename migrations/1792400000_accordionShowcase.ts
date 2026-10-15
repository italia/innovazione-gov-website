import { Client } from "@datocms/cli/lib/cma-client-node";

const CONTENITORI = ["homepage", "page"];

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const internalLink = itemTypes.find((t) => t.api_key === "internal_link");
  const externalLink = itemTypes.find((t) => t.api_key === "external_link");
  if (!internalLink || !externalLink)
    throw new Error("modelli dei link non trovati");

  const esistenteVoce = itemTypes.find(
    (itemType) => itemType.api_key === "showcase_item",
  );
  const voce =
    esistenteVoce ??
    (await client.itemTypes.create({
      name: "Voce approfondimento",
      api_key: "showcase_item",
      modular_block: true,
      hint: "Una voce della fisarmonica, con la sua immagine a destra.",
    }));

  if (!esistenteVoce) {
    console.log('Create fields in block "Voce approfondimento"');
    await client.fields.create(voce.id, {
      label: "Titolo",
      api_key: "header",
      field_type: "string",
      validators: { required: {} },
      appearance: { addons: [], editor: "single_line", parameters: {} },
      position: 1,
    });
    await client.fields.create(voce.id, {
      label: "Testo",
      api_key: "body",
      field_type: "text",
      appearance: {
        addons: [],
        editor: "markdown",
        parameters: { toolbar: ["bold", "italic", "link"] },
      },
      position: 2,
    });
    await client.fields.create(voce.id, {
      label: "Immagine",
      api_key: "image",
      field_type: "file",
      hint: "Compare a destra quando la voce è aperta.",
      validators: {
        extension: { predefined_list: "image" },
        required_alt_title: { title: false, alt: true },
      },
      appearance: { addons: [], editor: "file", parameters: {} },
      position: 3,
    });
    await client.fields.create(voce.id, {
      label: "CTA",
      api_key: "cta",
      field_type: "single_block",
      validators: {
        single_block_blocks: { item_types: [internalLink.id, externalLink.id] },
      },
      appearance: {
        addons: [],
        editor: "framed_single_block",
        parameters: { start_collapsed: true },
      },
      position: 4,
    });
  }

  const esistente = itemTypes.find(
    (itemType) => itemType.api_key === "accordion_showcase",
  );
  const blocco =
    esistente ??
    (await client.itemTypes.create({
      name: "Approfondimenti con immagine",
      api_key: "accordion_showcase",
      modular_block: true,
      hint: "Fisarmonica a sinistra, immagine a destra che cambia con la voce aperta.",
    }));

  if (!esistente) {
    console.log('Create fields in block "Approfondimenti con immagine"');
    await client.fields.create(blocco.id, {
      label: "Titolo",
      api_key: "title",
      field_type: "string",
      appearance: { addons: [], editor: "single_line", parameters: {} },
      position: 1,
    });
    await client.fields.create(blocco.id, {
      label: "Voci",
      api_key: "items",
      field_type: "rich_text",
      validators: { rich_text_blocks: { item_types: [voce.id] } },
      appearance: {
        addons: [],
        editor: "rich_text",
        parameters: { start_collapsed: true },
      },
      position: 2,
    });
    await client.fields.create(blocco.id, {
      label: "CTA",
      api_key: "cta",
      field_type: "single_block",
      validators: {
        single_block_blocks: { item_types: [internalLink.id, externalLink.id] },
      },
      appearance: {
        addons: [],
        editor: "framed_single_block",
        parameters: { start_collapsed: true },
      },
      position: 3,
    });
  }

  for (const apiKey of CONTENITORI) {
    const contenitore = itemTypes.find((t) => t.api_key === apiKey);
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
    if (ammessi.includes(blocco.id)) continue;
    console.log(`Allow "accordion_showcase" in ${apiKey}.content`);
    await client.fields.update(campo.id, {
      validators: { rich_text_blocks: { item_types: [...ammessi, blocco.id] } },
    });
  }
}
