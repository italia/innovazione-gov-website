import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const wideLinkCard = itemTypes.find(
    (itemType) => itemType.api_key === "wide_link_card",
  );
  if (!wideLinkCard) throw new Error("blocco wide_link_card non trovato");

  const fields = await client.fields.list(wideLinkCard.id);
  const category = fields.find((field) => field.api_key === "category");
  if (!category) throw new Error("campo category non trovato");

  const daCreare = [
    {
      api_key: "hide_category",
      label: "Nascondi la categoria",
      hint: "Toglie dalla scheda la pastiglia con l'argomento.",
    },
    {
      api_key: "hide_date",
      label: "Nascondi la data",
      hint: "Toglie dalla scheda la data dell'articolo collegato.",
    },
  ];

  let posizione = category.position;
  for (const campo of daCreare) {
    posizione += 1;
    if (fields.some((field) => field.api_key === campo.api_key)) {
      console.log(`\`${campo.api_key}\` già presente su wide_link_card`);
      continue;
    }
    console.log(
      `Create Boolean field "${campo.label}" (\`${campo.api_key}\`) in block "Wide link card" (\`wide_link_card\`)`,
    );
    await client.fields.create(wideLinkCard.id, {
      label: campo.label,
      api_key: campo.api_key,
      field_type: "boolean",
      hint: campo.hint,
      appearance: { addons: [], editor: "boolean", parameters: {} },
      position: posizione,
    });
  }
}
