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
  const topicList = itemTypes.find(
    (itemType) => itemType.api_key === "topic_list",
  );
  const page = itemTypes.find((itemType) => itemType.api_key === "page");
  if (!topicList || !page)
    throw new Error("modelli topic_list o page non trovati");

  const fields = await client.fields.list(topicList.id);
  if (!fields.some((field) => field.api_key === "title")) {
    console.log('Create String field "Titolo" (`title`) in block `topic_list`');
    await client.fields.create(topicList.id, {
      label: "Titolo",
      api_key: "title",
      field_type: "string",
      hint: "Facoltativo: se compilato compare sopra l'elenco degli argomenti.",
      validators: {},
      appearance: {
        addons: [],
        editor: "single_line",
        parameters: { heading: false },
      },
      position: 0,
    });
  }

  const content = (await client.fields.list(page.id)).find(
    (field) => field.api_key === "content",
  );
  if (!content) throw new Error("campo content non trovato su page");
  const allowed = readItemTypes(content.validators, "rich_text_blocks");
  if (!allowed)
    throw new Error("il campo content non espone i blocchi ammessi");
  if (allowed.includes(topicList.id)) {
    console.log("`topic_list` già ammesso nelle pagine");
    return;
  }

  console.log(
    'Allow block "Elenco argomenti" (`topic_list`) in field `content` of model "Pagina" (`page`)',
  );
  await client.fields.update(content.id, {
    validators: {
      rich_text_blocks: { item_types: [...allowed, topicList.id] },
    },
  });
}
