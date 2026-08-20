import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  console.log("Creating new fields/fieldsets");

  console.log(
    'Create Boolean field "Mostra indice della pagina" (`show_page_index`) in block model "Article structured text" (`structured_text`)',
  );
  await client.fields.create("EAJfEdPjRVy9SJIOnQDM_w", {
    id: "DPpfiLIbTqWjp6CmedN7xg",
    label: "Mostra indice della pagina",
    field_type: "boolean",
    api_key: "show_page_index",
    hint: "Mostra l'indice laterale con le ancore ai titoli di livello 2 di questo blocco. Usalo su un solo blocco per pagina.",
    appearance: { addons: [], editor: "boolean", parameters: {} },
    default_value: false,
  });
}
