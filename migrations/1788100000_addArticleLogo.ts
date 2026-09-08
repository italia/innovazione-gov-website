import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const article = itemTypes.find((itemType) => itemType.api_key === "article");
  if (!article) throw new Error("modello article non trovato");

  const fields = await client.fields.list(article.id);
  if (fields.some((field) => field.api_key === "logo")) {
    console.log("`logo` già presente sul modello article");
    return;
  }

  const image = fields.find((field) => field.api_key === "image");

  console.log(
    'Create File field "Logo" (`logo`) in model "Articolo" (`article`)',
  );
  await client.fields.create(article.id, {
    label: "Logo",
    api_key: "logo",
    field_type: "file",
    localized: true,
    hint: "Il marchio del progetto, su fondo trasparente: le card in evidenza lo usano al posto dell'immagine di copertina.",
    validators: {},
    appearance: { addons: [], editor: "file", parameters: {} },
    position: image ? image.position + 1 : undefined,
  });
}
