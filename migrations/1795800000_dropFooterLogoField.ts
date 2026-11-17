import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const layout = itemTypes.find((itemType) => itemType.api_key === "layout");
  if (!layout) throw new Error("modello layout non trovato");

  const fields = await client.fields.list(layout.id);

  const footerLogo = fields.find((field) => field.api_key === "footer_logo");
  if (footerLogo) {
    console.log(
      'Destroy File field "footer_logo": il marchio arriva da Organizations',
    );
    await client.fields.destroy(footerLogo.id);
  }

  const organizations = fields.find(
    (field) => field.api_key === "organizations",
  );
  if (!organizations) throw new Error("campo organizations non trovato");

  console.log('Update the label and hint of "organizations"');
  await client.fields.update(organizations.id, {
    label: "Marchio del footer",
    hint: "Il primo marchio dell'elenco compare in fondo alla pagina, al posto dell'emblema e del nome scritto. Gli altri non vengono mostrati.",
  });
}
