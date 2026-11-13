import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const carousel = itemTypes.find(
    (itemType) => itemType.api_key === "highlight_carousel",
  );
  if (!carousel) throw new Error("blocco highlight_carousel non trovato");

  const fields = await client.fields.list(carousel.id);
  const items = fields.find((field) => field.api_key === "items");
  if (!items) throw new Error("campo items non trovato");

  const nuovi = [
    {
      api_key: "hide_date",
      label: "Nascondi la data",
      hint: "Le attività non mostrano mai la data, anche con la spunta tolta.",
    },
    {
      api_key: "hide_topics",
      label: "Nascondi gli argomenti",
      hint: "Le attività non mostrano mai gli argomenti, anche con la spunta tolta.",
    },
  ];

  let position = items.position;

  for (const campo of nuovi) {
    position += 1;
    if (fields.some((field) => field.api_key === campo.api_key)) {
      console.log(`\`${campo.api_key}\` già presente su highlight_carousel`);
      continue;
    }
    console.log(
      `Create Boolean field "${campo.label}" (\`${campo.api_key}\`) in block "Highlight carousel"`,
    );
    await client.fields.create(carousel.id, {
      label: campo.label,
      api_key: campo.api_key,
      field_type: "boolean",
      hint: campo.hint,
      appearance: { addons: [], editor: "boolean", parameters: {} },
      position,
    });
  }
}
