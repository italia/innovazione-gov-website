import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const tag = itemTypes.find((itemType) => itemType.api_key === "tag");
  if (!tag) throw new Error("modello tag non trovato");

  const campi = await client.fields.list(tag.id);
  const haCampo = (apiKey: string) =>
    campi.some((field) => field.api_key === apiKey);

  const descrizione = campi.find((field) => field.api_key === "description");
  if (descrizione && descrizione.label !== "Abstract") {
    console.log('Rename "Descrizione" to "Abstract" in model "Tag" (`tag`)');
    await client.fields.update(descrizione.id, {
      label: "Abstract",
      hint: "Compare sotto al titolo nella pagina dell'argomento e nelle card in evidenza.",
    });
  }

  if (!haCampo("preview_image")) {
    console.log(
      'Create Image field "Immagine anteprima" (`preview_image`) in model "Tag" (`tag`)',
    );
    await client.fields.create(tag.id, {
      label: "Immagine anteprima",
      api_key: "preview_image",
      field_type: "file",
      hint: "Usata nelle card degli argomenti in evidenza e come immagine di condivisione.",
      validators: {
        extension: { predefined_list: "image" },
        required_alt_title: { title: false, alt: true },
      },
      appearance: { addons: [], editor: "file", parameters: {} },
      position: campi.length + 1,
    });
  }

  if (!haCampo("seo")) {
    console.log('Create SEO field "SEO" (`seo`) in model "Tag" (`tag`)');
    await client.fields.create(tag.id, {
      label: "SEO",
      api_key: "seo",
      field_type: "seo",
      hint: "Se lo lasci vuoto, titolo e descrizione vengono costruiti dal nome e dall'abstract.",
      validators: {
        title_length: { max: 60 },
        description_length: { max: 160 },
      },
      appearance: {
        addons: [],
        editor: "seo",
        parameters: {
          fields: ["title", "description", "image", "no_index", "twitter_card"],
          previews: [
            "google",
            "twitter",
            "facebook",
            "linkedin",
            "slack",
            "telegram",
            "whatsapp",
          ],
        },
      },
      position: campi.length + 2,
    });
  }
}
