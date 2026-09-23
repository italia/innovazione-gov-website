import { Client } from "@datocms/cli/lib/cma-client-node";

const STATI = [
  "open",
  "closed",
  "results",
  "withdrawn",
  "expired",
  "suspended",
];

const ETICHETTE_STATI: Record<string, string> = {
  open: "Aperta",
  closed: "Chiusa",
  results: "Esiti",
  withdrawn: "Ritirata",
  expired: "Scaduta",
  suspended: "Sospesa",
};

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const jobPosition = itemTypes.find(
    (itemType) => itemType.api_key === "job_position",
  );
  const tag = itemTypes.find((itemType) => itemType.api_key === "tag");
  if (!jobPosition || !tag)
    throw new Error("modelli job_position o tag non trovati");

  const fields = await client.fields.list(jobPosition.id);
  const has = (apiKey: string) =>
    fields.some((field) => field.api_key === apiKey);

  const status = fields.find((field) => field.api_key === "position_status");
  if (status) {
    console.log(
      'Update Single-line string field "Stato" (`position_status`) with the six states of the old CMS',
    );
    await client.fields.update(status.id, {
      validators: { required: {}, enum: { values: STATI } },
      appearance: {
        addons: [],
        editor: "string_select",
        parameters: {
          options: STATI.map((value) => ({
            hint: "",
            label: ETICHETTE_STATI[value],
            value,
          })),
        },
      },
    });
  }

  if (!has("topics")) {
    console.log(
      'Create Multiple links field "Argomenti" (`topics`) in model "Posizione lavorativa" (`job_position`)',
    );
    await client.fields.create(jobPosition.id, {
      label: "Argomenti",
      api_key: "topics",
      field_type: "links",
      localized: true,
      hint: "I tag mostrati accanto al titolo e usati per i contenuti collegati.",
      validators: { items_item_type: { item_types: [tag.id] } },
      appearance: { addons: [], editor: "links_select", parameters: {} },
    });
  }

  if (!has("office")) {
    console.log(
      'Create Single-line string field "Struttura di riferimento" (`office`) in model "Posizione lavorativa" (`job_position`)',
    );
    await client.fields.create(jobPosition.id, {
      label: "Struttura di riferimento",
      api_key: "office",
      field_type: "string",
      localized: true,
      hint: "L'ufficio o la struttura che pubblica la posizione.",
      validators: {},
      appearance: {
        addons: [],
        editor: "single_line",
        parameters: { heading: false },
      },
    });
  }

  if (!has("sort_date")) {
    console.log(
      'Create Date field "Data di ordinamento" (`sort_date`) in model "Posizione lavorativa" (`job_position`)',
    );
    await client.fields.create(jobPosition.id, {
      label: "Data di ordinamento",
      api_key: "sort_date",
      field_type: "date",
      hint: "Decide l'ordine nell'archivio quando le date di apertura coincidono.",
      validators: {},
      appearance: { addons: [], editor: "date_picker", parameters: {} },
    });
  }

  if (!has("show_sidebar")) {
    console.log(
      'Create Boolean field "Mostra l\'indice laterale" (`show_sidebar`) in model "Posizione lavorativa" (`job_position`)',
    );
    await client.fields.create(jobPosition.id, {
      label: "Mostra l'indice laterale",
      api_key: "show_sidebar",
      field_type: "boolean",
      hint: "Elenca i titoli delle sezioni in una colonna a sinistra del testo.",
      validators: {},
      appearance: { addons: [], editor: "boolean", parameters: {} },
      default_value: true,
    });
  }
}
