import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const donut = itemTypes.find((itemType) => itemType.api_key === "text_donut");
  if (!donut) throw new Error("blocco text_donut non trovato");

  const fields = await client.fields.list(donut.id);
  if (fields.some((field) => field.api_key === "alt_text")) {
    console.log("`alt_text` già presente sul blocco text_donut");
    return;
  }

  console.log(
    'Create Text field "Testo alternativo" (`alt_text`) in block "Text + donut" (`text_donut`)',
  );
  await client.fields.create(donut.id, {
    label: "Testo alternativo",
    api_key: "alt_text",
    field_type: "text",
    hint: "Descrive il grafico a chi usa uno screen reader: va letta come una frase compiuta, con il dato dentro. Se lo lasci vuoto viene generata una frase automatica dalla percentuale.",
    appearance: {
      addons: [],
      editor: "textarea",
      parameters: { placeholder: "" },
    },
    position: fields.length + 1,
  });
}
