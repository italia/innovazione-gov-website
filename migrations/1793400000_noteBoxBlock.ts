import { Client } from "@datocms/cli/lib/cma-client-node";

const CAMPI_CON_IL_BLOCCO: { itemType: string; field: string }[] = [
  { itemType: "article", field: "content" },
  { itemType: "structured_text", field: "content" },
];

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();

  let blocco = itemTypes.find((itemType) => itemType.api_key === "note_box");

  if (!blocco) {
    console.log('Create block model "Note box"');
    blocco = await client.itemTypes.create({
      name: "Note box",
      api_key: "note_box",
      modular_block: true,
    });

    await client.fields.create(blocco.id, {
      label: "Title",
      api_key: "title",
      field_type: "string",
      default_value: "Da tenere a mente",
      validators: { required: {} },
      appearance: {
        addons: [],
        editor: "single_line",
        parameters: { heading: false, placeholder: null },
      },
      position: 1,
    });

    await client.fields.create(blocco.id, {
      label: "Content",
      api_key: "paragraph",
      field_type: "text",
      validators: { required: {} },
      appearance: {
        addons: [],
        editor: "markdown",
        parameters: {
          toolbar: [
            "bold",
            "italic",
            "unordered_list",
            "ordered_list",
            "link",
            "fullscreen",
          ],
        },
      },
      position: 2,
    });
  }

  for (const { itemType, field } of CAMPI_CON_IL_BLOCCO) {
    const modello = itemTypes.find((voce) => voce.api_key === itemType);
    if (!modello) throw new Error(`modello ${itemType} non trovato`);

    const campi = await client.fields.list(modello.id);
    const campo = campi.find((voce) => voce.api_key === field);
    if (!campo) throw new Error(`campo ${itemType}.${field} non trovato`);

    const validators = campo.validators;
    const ammessi =
      "structured_text_blocks" in validators &&
      Array.isArray(validators.structured_text_blocks?.item_types)
        ? [...validators.structured_text_blocks.item_types]
        : [];
    if (ammessi.includes(blocco.id)) continue;

    const collegamenti =
      "structured_text_links" in validators &&
      Array.isArray(validators.structured_text_links?.item_types)
        ? [...validators.structured_text_links.item_types]
        : [];

    console.log(`Allow "note_box" in ${itemType}.${field}`);
    const blocchiEcollegamenti = {
      structured_text_blocks: { item_types: [...ammessi, blocco.id] },
      structured_text_links: { item_types: collegamenti },
    };

    await client.fields.update(campo.id, {
      validators:
        "required" in validators
          ? { ...blocchiEcollegamenti, required: {} }
          : blocchiEcollegamenti,
    });
  }
}
