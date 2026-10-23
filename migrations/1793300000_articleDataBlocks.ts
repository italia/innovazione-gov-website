import { Client } from "@datocms/cli/lib/cma-client-node";

const DA_AMMETTERE = ["statistic_block", "icon_list_block"];

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const article = itemTypes.find((itemType) => itemType.api_key === "article");
  if (!article) throw new Error("modello article non trovato");

  const campi = await client.fields.list(article.id);
  const contenuto = campi.find((field) => field.api_key === "content");
  if (!contenuto) throw new Error("campo content non trovato");

  const validators = contenuto.validators;
  const ammessi =
    "structured_text_blocks" in validators &&
    Array.isArray(validators.structured_text_blocks?.item_types)
      ? [...validators.structured_text_blocks.item_types]
      : [];

  for (const apiKey of DA_AMMETTERE) {
    const blocco = itemTypes.find((itemType) => itemType.api_key === apiKey);
    if (!blocco || ammessi.includes(blocco.id)) continue;
    console.log(`Allow "${apiKey}" in article.content`);
    ammessi.push(blocco.id);
  }
  const collegamenti =
    "structured_text_links" in validators &&
    Array.isArray(validators.structured_text_links?.item_types)
      ? [...validators.structured_text_links.item_types]
      : [];
  const blocchiEcollegamenti = {
    structured_text_blocks: { item_types: ammessi },
    structured_text_links: { item_types: collegamenti },
  };

  await client.fields.update(contenuto.id, {
    validators:
      "required" in validators
        ? { ...blocchiEcollegamenti, required: {} }
        : blocchiEcollegamenti,
  });

  const statistiche = itemTypes.find(
    (itemType) => itemType.api_key === "statistic_block",
  );
  if (!statistiche) throw new Error("modello statistic_block non trovato");
  const campiStatistiche = await client.fields.list(statistiche.id);
  if (campiStatistiche.some((field) => field.api_key === "layout")) return;

  console.log('Create String field "Presentazione" in block "Statistic block"');
  await client.fields.create(statistiche.id, {
    label: "Presentazione",
    api_key: "layout",
    field_type: "string",
    hint: "Vale quando il blocco è dentro il testo di un articolo o di una pagina. Riquadri: schede su sfondo azzurro. Barra laterale: riga blu a sinistra del dato.",
    validators: { enum: { values: ["box", "bar", "plain"] } },
    appearance: {
      addons: [],
      editor: "string_select",
      parameters: {
        options: [
          { label: "Riquadri", value: "box" },
          { label: "Barra laterale", value: "bar" },
          { label: "Semplice", value: "plain" },
        ],
      },
    },
    position: campiStatistiche.length + 1,
  });
}
