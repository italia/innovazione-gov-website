import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const tag = itemTypes.find((itemType) => itemType.api_key === "tag");
  if (!tag) throw new Error("modello tag non trovato");

  const fields = await client.fields.list(tag.id);
  if (fields.some((field) => field.api_key === "description")) {
    console.log("`description` già presente sul modello tag");
    return;
  }

  const slug = fields.find((field) => field.api_key === "slug");

  console.log(
    'Create Text field "Descrizione" (`description`) in model "Tag" (`tag`)',
  );
  await client.fields.create(tag.id, {
    label: "Descrizione",
    api_key: "description",
    field_type: "text",
    hint: "Una o due righe introduttive: compaiono sotto il titolo nella pagina dell'argomento. Se resta vuota, la pagina mostra solo il titolo.",
    validators: {},
    appearance: {
      addons: [],
      editor: "textarea",
      parameters: { placeholder: null },
    },
    position: slug ? slug.position + 1 : undefined,
  });
}
