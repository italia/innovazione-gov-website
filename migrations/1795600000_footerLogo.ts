import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const layout = itemTypes.find((itemType) => itemType.api_key === "layout");
  if (!layout) throw new Error("modello layout non trovato");

  const fields = await client.fields.list(layout.id);
  if (fields.some((field) => field.api_key === "footer_logo")) {
    console.log("`footer_logo` già presente sul modello layout");
    return;
  }

  const siteName = fields.find((field) => field.api_key === "site_name");
  if (!siteName) throw new Error("campo site_name non trovato");

  console.log(
    'Create File field "Logo del footer" (`footer_logo`) in model "Layout" (`layout`)',
  );
  await client.fields.create(layout.id, {
    label: "Logo del footer",
    api_key: "footer_logo",
    field_type: "file",
    hint: "Il marchio per esteso, su fondo scuro. Caricandolo prende il posto dell'emblema e del nome scritto in fondo alla pagina.",
    appearance: { addons: [], editor: "file", parameters: {} },
    validators: {
      extension: { predefined_list: "image" },
      required_alt_title: { alt: true, title: false },
    },
    position: siteName.position + 1,
  });
}
