import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const article = itemTypes.find((itemType) => itemType.api_key === "article");
  if (!article) throw new Error("modello article non trovato");

  const fields = await client.fields.list(article.id);
  if (fields.some((field) => field.api_key === "show_hero_download")) {
    console.log("`show_hero_download` già presente sul modello article");
    return;
  }

  const attachments = fields.find((field) => field.api_key === "attachments");

  console.log(
    'Create Boolean field "Bottone di download nella testata" (`show_hero_download`) in model "Articolo" (`article`)',
  );
  await client.fields.create(article.id, {
    label: "Bottone di download nella testata",
    api_key: "show_hero_download",
    field_type: "boolean",
    hint: "Mette in cima alla pagina, sotto la data, un bottone che scarica il primo file del campo Allegati. Senza allegati il bottone non compare comunque.",
    appearance: { addons: [], editor: "boolean", parameters: {} },
    position: attachments ? attachments.position + 1 : fields.length,
  });
}
