import {
  Client,
  type StringFieldValidators,
} from "@datocms/cli/lib/cma-client-node";

type SelectOption = { label: string; value: string; hint: string };

function haEnum(validators: object): validators is StringFieldValidators & {
  enum: { values: string[] };
} {
  return "enum" in validators;
}

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const cardLinkList = itemTypes.find(
    (itemType) => itemType.api_key === "card_link_list",
  );
  if (!cardLinkList) throw new Error("blocco card_link_list non trovato");

  const fields = await client.fields.list(cardLinkList.id);
  const lastItems = fields.find((field) => field.api_key === "last_items");
  if (!lastItems) throw new Error("campo last_items non trovato");

  if (!haEnum(lastItems.validators)) {
    throw new Error("campo last_items senza validator enum");
  }
  const valori = lastItems.validators.enum;

  if (valori.values.includes("announcement")) {
    console.log("`announcement` già fra le opzioni di last_items");
    return;
  }

  const parametri = lastItems.appearance.parameters as {
    options: SelectOption[];
  };

  console.log(
    'Add "Avvisi pubblici" to the automatic sources of card_link_list',
  );
  await client.fields.update(lastItems.id, {
    label: "Contenuti automatici",
    hint: "Riempie la sezione con gli ultimi contenuti del tipo scelto. Con le card orizzontali ne entrano al massimo 2.",
    validators: {
      ...lastItems.validators,
      enum: { values: [...valori.values, "announcement"] },
    },
    appearance: {
      ...lastItems.appearance,
      parameters: {
        ...parametri,
        options: [
          ...parametri.options,
          {
            label: "Avvisi pubblici",
            value: "announcement",
            hint: "Dal più recente, con stato e data di scadenza.",
          },
        ],
      },
    },
  });
}
