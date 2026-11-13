import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const layout = itemTypes.find((itemType) => itemType.api_key === "layout");
  if (!layout) throw new Error("modello layout non trovato");

  const fields = await client.fields.list(layout.id);
  if (fields.some((field) => field.api_key === "hide_header_social")) {
    console.log("`hide_header_social` già presente sul modello layout");
    return;
  }

  const utility = fields.find((field) => field.api_key === "utility");

  console.log(
    'Create Boolean field "Nascondi le icone social nell\'header" (`hide_header_social`) in model "Layout" (`layout`)',
  );
  await client.fields.create(layout.id, {
    label: "Nascondi le icone social nell'header",
    api_key: "hide_header_social",
    field_type: "boolean",
    hint: "Le stesse icone restano in fondo alla pagina: qui decidi solo se mostrarle anche accanto alla barra di ricerca.",
    appearance: { addons: [], editor: "boolean", parameters: {} },
    position: utility ? utility.position + 1 : fields.length,
  });
}
