import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const insight = itemTypes.find((itemType) => itemType.api_key === "insight");
  if (!insight) throw new Error("modello insight non trovato");

  console.log(
    'Create Boolean field "Mostra menu delle sezioni" (`show_sections_nav`) in model "Articoli e sottopagine" (`insight`)',
  );
  await client.fields.create(insight.id, {
    label: "Mostra menu delle sezioni",
    api_key: "show_sections_nav",
    field_type: "boolean",
    hint: "Aggiunge sotto l'hero un menu orizzontale con i titoli delle sezioni della pagina, ancorati ai rispettivi blocchi.",
    appearance: { addons: [], editor: "boolean", parameters: {} },
    default_value: false,
  });
}
