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
    'Widen "Numero di card" (`cards_count`) in block "Argomenti in evidenza" to 1-12',
  );
  await client.fields.update(campo.id, {
    hint: "Quanti argomenti mostrare, fra quelli marcati come categoria. Se lo lasci vuoto ne mostra tre.",
    validators: { number_range: { min: 1, max: 12 } },
  });
}
