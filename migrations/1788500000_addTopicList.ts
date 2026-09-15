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
  const indexPage = itemTypes.find(
    (itemType) => itemType.api_key === "index_page",
  );
  const textImage = itemTypes.find(
    (itemType) => itemType.api_key === "text_image",
  );
  if (!indexPage || !textImage)
    throw new Error("modelli index_page o text_image non trovati");

  const existing = itemTypes.find(
    (itemType) => itemType.api_key === "topic_list",
  );

  const block =
    existing ??
    (await client.itemTypes.create({
      name: "Elenco argomenti",
      api_key: "topic_list",
      modular_block: true,
      hint: "Elenca da sé gli argomenti che hanno almeno un contenuto, con il link alla pagina di ciascuno.",
    }));

  if (!existing) {
    console.log(
      'Create block model "Elenco argomenti" (`topic_list`) with background, order and count',
    );
    await client.fields.create(block.id, {
      label: "Colore di sfondo",
      api_key: "background_color",
      field_type: "string",
      validators: {
        required: {},
        enum: { values: ["default", "lighter", "primary", "dark"] },
      },
      appearance: {
        addons: [],
        editor: "string_select",
        parameters: {
          options: [
            { hint: "", label: "Bianco", value: "default" },
            { hint: "", label: "Grigio chiaro", value: "lighter" },
            { hint: "", label: "Blu", value: "primary" },
            { hint: "", label: "Blu scuro", value: "dark" },
          ],
        },
      },
      default_value: "default",
    });
    await client.fields.create(block.id, {
      label: "Ordine",
      api_key: "order",
      field_type: "string",
      hint: "Alfabetico, oppure dal più usato al meno usato.",
      validators: {
        required: {},
        enum: { values: ["alfabetico", "frequenza"] },
      },
      appearance: {
        addons: [],
        editor: "string_radio_group",
        parameters: {
          radios: [
            { hint: "", label: "Alfabetico", value: "alfabetico" },
            { hint: "", label: "Per numero di contenuti", value: "frequenza" },
          ],
        },
      },
      default_value: "alfabetico",
    });
    await client.fields.create(block.id, {
      label: "Mostra il numero di contenuti",
      api_key: "show_count",
      field_type: "boolean",
      validators: {},
      appearance: { addons: [], editor: "boolean", parameters: {} },
      default_value: true,
    });
  }

  const content = (await client.fields.list(indexPage.id)).find(
    (field) => field.api_key === "content",
  );
  if (!content) throw new Error("campo content non trovato su index_page");

  const allowed = readItemTypes(content.validators, "rich_text_blocks");
  if (!allowed)
    throw new Error("il campo content non espone i blocchi ammessi");

  const daAggiungere = [block.id, textImage.id].filter(
    (id) => !allowed.includes(id),
  );
  if (!daAggiungere.length) {
    console.log("index_page già ammette elenco argomenti e testo-immagine");
    return;
  }

  console.log(
    'Allow "Elenco argomenti" and "Testo e immagine" in field `content` of model "Pagina indice" (`index_page`)',
  );
  await client.fields.update(content.id, {
    validators: {
      rich_text_blocks: { item_types: [...allowed, ...daAggiungere] },
    },
  });
}
