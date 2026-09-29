import { Client } from "@datocms/cli/lib/cma-client-node";

const BLOCCHI_DELLA_LANDING = [
  "text_donut",
  "settings_chart",
  "settings_kpi",
  "list_card_editorial_with_icon_wrapper",
];

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const page = itemTypes.find((itemType) => itemType.api_key === "page");
  if (!page) throw new Error("modello page non trovato");

  const daAggiungere = BLOCCHI_DELLA_LANDING.map((apiKey) => {
    const blocco = itemTypes.find((itemType) => itemType.api_key === apiKey);
    if (!blocco) throw new Error(`blocco ${apiKey} non trovato`);
    return blocco.id;
  });

  const content = (await client.fields.list(page.id)).find(
    (field) => field.api_key === "content",
  );
  if (!content) throw new Error("campo content non trovato su page");

  const validators = content.validators;
  const ammessi =
    "rich_text_blocks" in validators &&
    Array.isArray(validators.rich_text_blocks?.item_types)
      ? validators.rich_text_blocks.item_types
      : [];

  const aggiornati = [...new Set([...ammessi, ...daAggiungere])];
  if (aggiornati.length === ammessi.length) return;

  console.log(
    'Update Modular content field "content" (`content`) in model "Pagina" (`page`) with the landing blocks',
  );
  await client.fields.update(content.id, {
    validators: { rich_text_blocks: { item_types: aggiornati } },
  });
}
