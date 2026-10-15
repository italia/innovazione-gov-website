import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const voce = itemTypes.find(
    (itemType) => itemType.api_key === "highlight_item",
  );
  if (!voce) throw new Error("blocco highlight_item non trovato");

  const campi = await client.fields.list(voce.id);
  const manca = (apiKey: string) =>
    !campi.some((field) => field.api_key === apiKey);

  if (manca("paragraph")) {
    console.log('Create Text field "Testo" in block "Contenuto in evidenza"');
    await client.fields.create(voce.id, {
      label: "Testo",
      api_key: "paragraph",
      field_type: "text",
      hint: "Sostituisce il sommario del contenuto collegato. Lascialo vuoto per usare quello originale.",
      appearance: {
        addons: [],
        editor: "markdown",
        parameters: { toolbar: ["bold", "italic", "link"] },
      },
      position: campi.length + 1,
    });
  }

  if (manca("image")) {
    console.log(
      'Create Image field "Immagine" in block "Contenuto in evidenza"',
    );
    await client.fields.create(voce.id, {
      label: "Immagine",
      api_key: "image",
      field_type: "file",
      hint: "Sostituisce l'immagine del contenuto collegato.",
      validators: {
        extension: { predefined_list: "image" },
        required_alt_title: { title: false, alt: true },
      },
      appearance: { addons: [], editor: "file", parameters: {} },
      position: campi.length + 2,
    });
  }
}
