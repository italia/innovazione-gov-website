import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const evidenza = itemTypes.find(
    (itemType) => itemType.api_key === "topic_highlight",
  );
  if (!evidenza) throw new Error("blocco topic_highlight non trovato");

  const campo = (await client.fields.list(evidenza.id)).find(
    (field) => field.api_key === "cards_count",
  );
  if (!campo) throw new Error("campo cards_count non trovato");

  console.log(
    'Let "Numero di card" (`cards_count`) accept 0 to show every topic',
  );
  await client.fields.update(campo.id, {
    hint: "Quanti argomenti mostrare, fra quelli marcati come categoria. Vuoto o 0 li mostra tutti.",
    validators: { number_range: { min: 0, max: 12 } },
  });
}
