import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();

  const kpiElement = itemTypes.find(
    (itemType) => itemType.api_key === "kpi_element",
  );
  if (!kpiElement) throw new Error("modello kpi_element non trovato");

  const kpiFields = await client.fields.list(kpiElement.id);
  if (!kpiFields.some((field) => field.api_key === "icon")) {
    console.log(
      'Create File field "Icona" (`icon`) in model "Kpi element" (`kpi_element`)',
    );
    await client.fields.create(kpiElement.id, {
      label: "Icona",
      api_key: "icon",
      field_type: "file",
      hint: "Illustrazione dell'indicatore, mostrata nelle card a destra del valore.",
      validators: { extension: { predefined_list: "image" } },
      appearance: { addons: [], editor: "file", parameters: {} },
    });
  }

  const textStatistic = itemTypes.find(
    (itemType) => itemType.api_key === "text_statistic",
  );
  if (!textStatistic) throw new Error("blocco text_statistic non trovato");

  const sectionFields = await client.fields.list(textStatistic.id);

  if (!sectionFields.some((field) => field.api_key === "layout")) {
    console.log(
      'Create Single-line string field "Layout" (`layout`) in block model "Text statistic" (`text_statistic`)',
    );
    await client.fields.create(textStatistic.id, {
      label: "Layout",
      api_key: "layout",
      field_type: "string",
      hint: "«Card» mostra ogni indicatore in una card con titolo, unità di misura, valore e icona.",
      default_value: "default",
      validators: {
        enum: { values: ["default", "cards"] },
      },
      appearance: {
        addons: [],
        editor: "string_select",
        parameters: {
          options: [
            { hint: "", label: "Elenco semplice", value: "default" },
            { hint: "", label: "Card con icona", value: "cards" },
          ],
        },
      },
    });
  }

  if (!sectionFields.some((field) => field.api_key === "image")) {
    console.log(
      'Create File field "Immagine" (`image`) in block model "Text statistic" (`text_statistic`)',
    );
    await client.fields.create(textStatistic.id, {
      label: "Immagine",
      api_key: "image",
      field_type: "file",
      hint: "Illustrazione tonda accanto al testo, usata dal layout a card.",
      validators: { extension: { predefined_list: "image" } },
      appearance: { addons: [], editor: "file", parameters: {} },
    });
  }
}
