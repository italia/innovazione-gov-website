import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();

  const tag = itemTypes.find((itemType) => itemType.api_key === "tag");
  if (!tag) throw new Error("modello tag non trovato");

  const campiTag = await client.fields.list(tag.id);
  if (campiTag.some((field) => field.api_key === "is_highlighted")) {
    console.log("`is_highlighted` già presente sul modello tag");
  } else {
    console.log(
      'Create Boolean field "Mostra fra gli argomenti in evidenza" (`is_highlighted`) in model "Tag" (`tag`)',
    );
    await client.fields.create(tag.id, {
      label: "Mostra fra gli argomenti in evidenza",
      api_key: "is_highlighted",
      field_type: "boolean",
      hint: 'I tag marcati compaiono nel blocco "Argomenti in evidenza" e fra i collegamenti del footer, in ordine alfabetico. Se non ne marchi nessuno vengono scelti in automatico quelli con più contenuti.',
      appearance: { addons: [], editor: "boolean", parameters: {} },
      default_value: false,
      position: campiTag.length + 1,
    });
  }

  const evidenza = itemTypes.find(
    (itemType) => itemType.api_key === "topic_highlight",
  );
  if (!evidenza) throw new Error("blocco topic_highlight non trovato");

  console.log('Update the hint of block "Argomenti in evidenza"');
  await client.itemTypes.update(evidenza.id, {
    hint: 'Le card degli argomenti marcati come "in evidenza" sul tag, in ordine alfabetico.',
  });

  const cardsCount = (await client.fields.list(evidenza.id)).find(
    (field) => field.api_key === "cards_count",
  );
  if (!cardsCount) throw new Error("campo cards_count non trovato");

  console.log(
    'Narrow "Numero di card" (`cards_count`) to the automatic fallback',
  );
  await client.fields.update(cardsCount.id, {
    hint: 'Vale solo se nessun tag è marcato come "in evidenza": in quel caso mostra i primi per numero di contenuti. Vuoto o 0 li mostra tutti.',
  });
}
