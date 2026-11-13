import { Client } from "@datocms/cli/lib/cma-client-node";

const TAB_TYPE_VALUE = "announcement";
const TAB_TYPE_LABEL = "Avvisi pubblici";

type SelectOption = { hint: string; label: string; value: string };

async function tabTypeField(client: Client) {
  const itemTypes = await client.itemTypes.list();
  const tab = itemTypes.find(
    (itemType) => itemType.api_key === "catalogue_tab",
  );
  if (!tab) throw new Error("modello catalogue_tab non trovato");

  const fields = await client.fields.list(tab.id);
  const field = fields.find((voce) => voce.api_key === "news_page_tab_type");
  if (!field) throw new Error("campo news_page_tab_type non trovato");

  const parameters = field.appearance.parameters as {
    options?: SelectOption[];
  };

  return { field, options: parameters.options ?? [] };
}

export default async function (client: Client) {
  const { field, options } = await tabTypeField(client);

  if (options.some((option) => option.value === TAB_TYPE_VALUE)) {
    console.log(`"${TAB_TYPE_VALUE}" già fra i tipi di tab`);
    return;
  }

  console.log(`Add "${TAB_TYPE_LABEL}" to news_page_tab_type options`);
  await client.fields.update(field.id, {
    appearance: {
      ...field.appearance,
      parameters: {
        ...field.appearance.parameters,
        options: [
          ...options,
          { hint: "", label: TAB_TYPE_LABEL, value: TAB_TYPE_VALUE },
        ],
      },
    },
  });
}

export async function down(client: Client) {
  const { field, options } = await tabTypeField(client);

  console.log(`Remove "${TAB_TYPE_LABEL}" from news_page_tab_type options`);
  await client.fields.update(field.id, {
    appearance: {
      ...field.appearance,
      parameters: {
        ...field.appearance.parameters,
        options: options.filter((option) => option.value !== TAB_TYPE_VALUE),
      },
    },
  });
}
