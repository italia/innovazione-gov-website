import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const page = itemTypes.find((itemType) => itemType.api_key === "page");
  if (!page) throw new Error("modello page non trovato");

  const fields = await client.fields.list(page.id);
  if (fields.some((field) => field.api_key === "show_sections_nav")) {
    console.log("`show_sections_nav` già presente sulle pagine");
    return;
  }

  console.log(
    'Create Boolean field "Mostra l\'indice della pagina" (`show_sections_nav`) in model "Pagina" (`page`)',
  );
  await client.fields.create(page.id, {
    label: "Mostra l'indice della pagina",
    api_key: "show_sections_nav",
    field_type: "boolean",
    hint: "Elenca in cima i titoli delle sezioni, con il collegamento a ciascuna.",
    validators: {},
    appearance: { addons: [], editor: "boolean", parameters: {} },
    default_value: false,
  });
}
