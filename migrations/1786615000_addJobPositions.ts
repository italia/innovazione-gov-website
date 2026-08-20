import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  console.log("Create new models/block models");

  console.log('Create model "Posizioni lavorative" (`job_position`)');
  const jobPosition = await client.itemTypes.create({
    id: "URPTMKJzQLCtP4sCcYHylg",
    name: "Posizioni lavorative",
    api_key: "job_position",
    modular_block: false,
    draft_saving_active: true,
    all_locales_required: false,
    hint: "Posizione lavorativa con pagina di dettaglio, elencata nell'archivio.",
  });

  console.log(
    'Create block model "Elenco posizioni lavorative" (`job_position_list`)',
  );
  const listBlock = await client.itemTypes.create({
    id: "GNzG5TXJSkKy7N2pq21Z5A",
    name: "Elenco posizioni lavorative",
    api_key: "job_position_list",
    modular_block: true,
    draft_saving_active: false,
    hint: "Elenca le posizioni lavorative con paginazione. Le voci arrivano dal modello Posizioni lavorative.",
  });

  console.log("Creating new fields/fieldsets");

  await client.fields.create(listBlock.id, {
    id: "b-iuBn0VTLSakfBjZlmW4Q",
    label: "Elementi per pagina",
    api_key: "element_per_page",
    field_type: "integer",
    default_value: 5,
    hint: "Quante posizioni mostrare per pagina (default 5).",
    appearance: { addons: [], editor: "integer", parameters: {} },
  });

  const title = await client.fields.create(jobPosition.id, {
    id: "eHB11dcWRPu5CwNBThBlRA",
    label: "Titolo",
    api_key: "title",
    field_type: "string",
    localized: true,
    validators: { required: {} },
    appearance: {
      addons: [],
      editor: "single_line",
      parameters: { heading: true },
    },
  });

  await client.fields.create(jobPosition.id, {
    id: "MetDSeqpSWSQ9ZAjwEiqfA",
    label: "Slug",
    api_key: "slug",
    field_type: "slug",
    localized: true,
    validators: {
      required: {},
      unique: {},
      slug_title_field: { title_field_id: title.id },
      slug_format: { predefined_pattern: "webpage_slug" },
    },
    appearance: {
      addons: [],
      editor: "slug",
      parameters: { url_prefix: null },
    },
  });

  // L'archivio può essere una Page o una sottopagina ("Articoli e sottopagine"):
  // da questo link derivano URL e breadcrumb della posizione.
  await client.fields.create(jobPosition.id, {
    id: "HEvX35C6RiyjSlkv0mHz1g",
    label: "Pagina di archivio",
    api_key: "parent_page",
    field_type: "link",
    localized: true,
    hint: "La pagina che elenca le posizioni: determina URL e breadcrumb.",
    validators: {
      required: {},
      item_item_type: {
        // Page + "Articoli e sottopagine": l'archivio puo' essere l'uno o l'altro
        item_types: ["MK1luhfjT5-vyrmLiB0Qeg", "T-HlXkO8SEWb8JYh5FuYCQ"],
      },
    },
    appearance: { addons: [], editor: "link_select", parameters: {} },
  });

  // Stato esplicito: il sito è statico, quindi calcolarlo dalla data di
  // chiusura lo lascerebbe indietro fino al deploy successivo.
  await client.fields.create(jobPosition.id, {
    id: "KreEPWjHQxGNMj9bLZ9wjA",
    label: "Stato",
    api_key: "position_status",
    field_type: "string",
    localized: false,
    default_value: "open",
    hint: "Determina il badge nell'archivio. Va aggiornato a mano alla chiusura.",
    validators: { required: {}, enum: { values: ["open", "closed"] } },
    appearance: {
      addons: [],
      editor: "string_radio_group",
      parameters: {
        radios: [
          { label: "Aperta", value: "open", hint: "" },
          { label: "Chiusa", value: "closed", hint: "" },
        ],
      },
    },
  });

  await client.fields.create(jobPosition.id, {
    id: "BntQcOdcS1eRNIJsr585jg",
    label: "Data di apertura",
    api_key: "open_date",
    field_type: "date",
    localized: false,
    appearance: { addons: [], editor: "date_picker", parameters: {} },
  });

  await client.fields.create(jobPosition.id, {
    id: "EDbPY_FBRn6gZ9Lbt-zM6w",
    label: "Data di chiusura",
    api_key: "close_date",
    field_type: "date",
    localized: false,
    appearance: { addons: [], editor: "date_picker", parameters: {} },
  });

  await client.fields.create(jobPosition.id, {
    id: "C-2M_vvDQ5SOH2xRWylInw",
    label: "Compenso",
    api_key: "compensation",
    field_type: "string",
    localized: true,
    appearance: {
      addons: [],
      editor: "single_line",
      parameters: { heading: false },
    },
  });

  await client.fields.create(jobPosition.id, {
    id: "ex-0R_-JRgeZ9yX4lNgbpg",
    label: "Abstract",
    api_key: "abstract",
    field_type: "text",
    localized: true,
    hint: "Usato sotto il titolo e come descrizione nell'archivio.",
    appearance: { addons: [], editor: "textarea", parameters: {} },
  });

  console.log(
    'Create Modular Content field "Contenuto" (`content`) in model "Posizioni lavorative"',
  );
  // Gli stessi blocchi del Content delle sottopagine, tranne l'elenco delle
  // posizioni: una posizione non contiene l'elenco di se stessa.
  await client.fields.create(jobPosition.id, {
    id: "GExlq_KTRZOADgrP7pC6uA",
    label: "Contenuto",
    api_key: "content",
    field_type: "rich_text",
    localized: true,
    validators: {
      rich_text_blocks: {
        item_types: [
          "Awg0gTrzT1WtWycAQ5I-cw",
          "BUcCRaSrRduMQYR0KakZBg",
          "BqiyK44MT9eCdscz8pcESg",
          "BttQ-GOdSDCjRZinK2Hevw",
          "EAJfEdPjRVy9SJIOnQDM_w",
          "PtFD-_7RS_6HmJAq7R2c9g",
          "R9Sa8uDfTpSRaWMISQiDFg",
          "SC9fd201RBSV7s31u6zCKg",
          "TTn5BjxOSdORIaGWSZ4MRg",
          "UKWQ1GcrSWy1u0UVIWhNLg",
          "U50kKrnkSua6L3eIAEFHhA",
          "Y90FAsoITzyeuRK7Q4PtiQ",
          "eYC6ITddSYSZVRiO1Ldt3g",
        ],
      },
    },
    appearance: {
      addons: [],
      editor: "rich_text",
      parameters: { start_collapsed: false },
    },
  });

  await client.fields.create(jobPosition.id, {
    id: "WwPR26UCQduXa00gxufALQ",
    label: "Seo",
    api_key: "seo",
    field_type: "seo",
    localized: true,
    validators: { title_length: { max: 60 }, description_length: { max: 160 } },
    appearance: {
      addons: [],
      editor: "seo",
      parameters: { fields: ["title", "description", "image"] },
    },
  });

  console.log("Update existing fields/fieldsets");

  console.log(
    'Add "Elenco posizioni lavorative" to the Content of "Articoli e sottopagine"',
  );
  await client.fields.update("Bnfp0BclTQCKPkHD3lvmPg", {
    validators: {
      rich_text_blocks: {
        item_types: [
          "Awg0gTrzT1WtWycAQ5I-cw",
          "BUcCRaSrRduMQYR0KakZBg",
          "BqiyK44MT9eCdscz8pcESg",
          "BttQ-GOdSDCjRZinK2Hevw",
          "EAJfEdPjRVy9SJIOnQDM_w",
          "PtFD-_7RS_6HmJAq7R2c9g",
          "R9Sa8uDfTpSRaWMISQiDFg",
          "SC9fd201RBSV7s31u6zCKg",
          "TTn5BjxOSdORIaGWSZ4MRg",
          "UKWQ1GcrSWy1u0UVIWhNLg",
          "U50kKrnkSua6L3eIAEFHhA",
          "Y90FAsoITzyeuRK7Q4PtiQ",
          "eYC6ITddSYSZVRiO1Ldt3g",
          "GNzG5TXJSkKy7N2pq21Z5A",
        ],
      },
    },
  });

  console.log('Add "Posizioni lavorative" option to the Catalogue tab type');
  await client.fields.update("N7VjZFjyTR6TzrY7MD3ugQ", {
    appearance: {
      addons: [],
      editor: "string_select",
      parameters: {
        options: [
          {
            hint: "",
            label: "Articoli interni senza sidebar",
            value: "story_item",
          },
          {
            hint: "",
            label: "Articoli interni con sidebar",
            value: "article",
          },
          {
            hint: "",
            label: "Webinar ed eventi",
            value: "webinar_item",
          },
          {
            hint: "",
            label: "Contenuto esterno",
            value: "news_item",
          },
          {
            hint: "",
            label: "Link e risorse",
            value: "resource",
          },
          {
            hint: "",
            label: "Risultati del PNRR",
            value: "measures",
          },
          {
            hint: "",
            label: "Interviste",
            value: "interview",
          },
          {
            hint: "",
            label: "Interventi",
            value: "participation",
          },
          {
            hint: "",
            label: "Comunicati stampa",
            value: "press_release",
          },
          {
            hint: "",
            label: "Focus",
            value: "focus_page",
          },
          {
            hint: "",
            label: "Posizioni lavorative",
            value: "job_position",
          },
        ],
      },
    },
  });
}
