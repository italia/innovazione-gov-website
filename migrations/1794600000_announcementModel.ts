import { Client } from "@datocms/cli/lib/cma-client-node";

const BLOCCHI_CONTENUTO = [
  "hero",
  "intro_article",
  "faq_section",
  "text_only",
  "structured_text",
  "text_image",
  "support_channels_section",
  "text_accordion",
  "list_collection",
  "support_cta_section",
  "text_use_case",
  "text_statistic",
  "card_link_list",
];

const CATEGORIE = [
  { value: "notice", label: "Avviso", hint: "" },
  { value: "call", label: "Bando", hint: "" },
  { value: "competition", label: "Concorso", hint: "" },
  { value: "tender", label: "Gara d'appalto", hint: "" },
  { value: "external_assignment", label: "Incarichi esterni", hint: "" },
  {
    value: "expression_of_interest",
    label: "Manifestazione d'interesse",
    hint: "",
  },
];

const STATI = [
  { value: "open", label: "Aperto", hint: "" },
  { value: "closed", label: "Chiuso", hint: "" },
  { value: "results", label: "Esiti", hint: "" },
  { value: "withdrawn", label: "Ritirato", hint: "" },
  { value: "expired", label: "Scaduto", hint: "" },
  { value: "suspended", label: "Sospeso", hint: "" },
];

const riferimentoLink = (itemTypeIds: string[]) => ({
  on_publish_with_unpublished_references_strategy: "fail" as const,
  on_reference_unpublish_strategy: "delete_references" as const,
  on_reference_delete_strategy: "delete_references" as const,
  item_types: itemTypeIds,
});

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const idPerApiKey = (apiKey: string): string => {
    const itemType = itemTypes.find((voce) => voce.api_key === apiKey);
    if (!itemType) throw new Error(`modello ${apiKey} non trovato`);
    return itemType.id;
  };

  const esistente = itemTypes.find(
    (itemType) => itemType.api_key === "announcement",
  );
  const modello = esistente ?? (await creaModello(client, idPerApiKey));
  await aggiungiContenutiCollegati(client, modello.id, idPerApiKey);
}

async function creaModello(
  client: Client,
  idPerApiKey: (apiKey: string) => string,
) {
  console.log('Create model "Avvisi pubblici" (`announcement`)');
  const announcement = await client.itemTypes.create({
    name: "Avvisi pubblici",
    api_key: "announcement",
    collection_appearance: "table",
    draft_mode_active: true,
    sortable: false,
    tree: false,
  });

  const title = await client.fields.create(announcement.id, {
    label: "Titolo",
    api_key: "title",
    field_type: "string",
    localized: true,
    validators: { required: {}, unique: {} },
    appearance: {
      addons: [],
      editor: "single_line",
      parameters: { heading: false, placeholder: null },
    },
    position: 1,
  });

  await client.itemTypes.update(announcement.id, {
    title_field: { id: title.id, type: "field" },
    presentation_title_field: { id: title.id, type: "field" },
  });

  await client.fields.create(announcement.id, {
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
      parameters: { url_prefix: null, placeholder: null },
    },
    position: 2,
  });

  await client.fields.create(announcement.id, {
    label: "Pagina di archivio",
    api_key: "parent_page",
    field_type: "link",
    localized: true,
    hint: "La pagina indice sotto cui compare l'avviso: determina anche la URL.",
    validators: {
      required: {},
      item_item_type: riferimentoLink([
        idPerApiKey("page"),
        idPerApiKey("insight"),
        idPerApiKey("index_page"),
      ]),
    },
    appearance: { addons: [], editor: "link_select", parameters: {} },
    position: 3,
  });

  await client.fields.create(announcement.id, {
    label: "Tipo",
    api_key: "announcement_category",
    field_type: "string",
    validators: {
      required: {},
      enum: { values: CATEGORIE.map((categoria) => categoria.value) },
    },
    appearance: {
      addons: [],
      editor: "string_select",
      parameters: { options: CATEGORIE },
    },
    position: 4,
  });

  await client.fields.create(announcement.id, {
    label: "Stato",
    api_key: "announcement_status",
    field_type: "string",
    validators: {
      required: {},
      enum: { values: STATI.map((stato) => stato.value) },
    },
    appearance: {
      addons: [],
      editor: "string_select",
      parameters: { options: STATI },
    },
    position: 5,
  });

  await client.fields.create(announcement.id, {
    label: "Data di apertura",
    api_key: "open_date",
    field_type: "date",
    validators: {},
    appearance: { addons: [], editor: "date_picker", parameters: {} },
    position: 6,
  });

  await client.fields.create(announcement.id, {
    label: "Data di scadenza",
    api_key: "close_date",
    field_type: "date",
    validators: {},
    appearance: { addons: [], editor: "date_picker", parameters: {} },
    position: 7,
  });

  await client.fields.create(announcement.id, {
    label: "Mostra la scadenza anche da chiuso",
    api_key: "show_date_after_closed",
    field_type: "boolean",
    hint: "Da spento, la data di scadenza sparisce dalla pagina quando l'avviso non è più aperto.",
    default_value: true,
    validators: {},
    appearance: { addons: [], editor: "boolean", parameters: {} },
    position: 8,
  });

  await client.fields.create(announcement.id, {
    label: "Struttura responsabile",
    api_key: "office",
    field_type: "string",
    localized: true,
    validators: {},
    appearance: {
      addons: [],
      editor: "single_line",
      parameters: { heading: false, placeholder: null },
    },
    position: 9,
  });

  await client.fields.create(announcement.id, {
    label: "Sito della struttura responsabile",
    api_key: "office_link",
    field_type: "string",
    localized: true,
    validators: { format: { predefined_pattern: "url" } },
    appearance: {
      addons: [],
      editor: "single_line",
      parameters: { heading: false, placeholder: "https://" },
    },
    position: 10,
  });

  await client.fields.create(announcement.id, {
    label: "Abstract",
    api_key: "abstract",
    field_type: "text",
    localized: true,
    validators: {},
    appearance: { addons: [], editor: "textarea", parameters: {} },
    position: 11,
  });

  await client.fields.create(announcement.id, {
    label: "Contenuto",
    api_key: "content",
    field_type: "rich_text",
    localized: true,
    validators: {
      rich_text_blocks: { item_types: BLOCCHI_CONTENUTO.map(idPerApiKey) },
    },
    appearance: {
      addons: [],
      editor: "rich_text",
      parameters: { start_collapsed: false },
    },
    position: 12,
  });

  await client.fields.create(announcement.id, {
    label: "Argomenti",
    api_key: "topics",
    field_type: "links",
    localized: true,
    validators: { items_item_type: riferimentoLink([idPerApiKey("tag")]) },
    appearance: {
      addons: [],
      editor: "links_select",
      parameters: { filters: [] },
    },
    position: 13,
  });

  await client.fields.create(announcement.id, {
    label: "Destinatari",
    api_key: "targets",
    field_type: "links",
    validators: { items_item_type: riferimentoLink([idPerApiKey("target")]) },
    appearance: {
      addons: [],
      editor: "links_select",
      parameters: { filters: [] },
    },
    position: 14,
  });

  await client.fields.create(announcement.id, {
    label: "Data di ordinamento",
    api_key: "sort_date",
    field_type: "date",
    hint: "Ordina gli avvisi negli elenchi. Di norma è la data di pubblicazione.",
    validators: {},
    appearance: { addons: [], editor: "date_picker", parameters: {} },
    position: 15,
  });

  await client.fields.create(announcement.id, {
    label: "Mostra l'indice laterale",
    api_key: "show_sidebar",
    field_type: "boolean",
    default_value: true,
    validators: {},
    appearance: { addons: [], editor: "boolean", parameters: {} },
    position: 16,
  });

  await client.fields.create(announcement.id, {
    label: "Immagine",
    api_key: "image",
    field_type: "file",
    validators: { required_alt_title: { title: false, alt: true } },
    appearance: { addons: [], editor: "file", parameters: {} },
    position: 17,
  });

  await client.fields.create(announcement.id, {
    label: "Seo",
    api_key: "seo",
    field_type: "seo",
    localized: true,
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
    position: 18,
  });

  console.log("modello `announcement` creato con 18 campi");
  return announcement;
}

async function aggiungiContenutiCollegati(
  client: Client,
  announcementId: string,
  idPerApiKey: (apiKey: string) => string,
) {
  const fields = await client.fields.list(announcementId);
  if (fields.some((field) => field.api_key === "related_content")) {
    console.log("`related_content` già presente sul modello announcement");
    return;
  }

  console.log(
    'Create Links field "Contenuti collegati" (`related_content`) in model "Avvisi pubblici" (`announcement`)',
  );
  await client.fields.create(announcementId, {
    label: "Contenuti collegati",
    api_key: "related_content",
    field_type: "links",
    hint: "Altri avvisi, notizie o comunicati che raccontano lo stesso percorso: compaiono in fondo alla pagina.",
    validators: {
      items_item_type: riferimentoLink([
        announcementId,
        idPerApiKey("article"),
      ]),
    },
    appearance: {
      addons: [],
      editor: "links_select",
      parameters: { filters: [] },
    },
    position: 19,
  });
}

export async function down(client: Client) {
  const itemTypes = await client.itemTypes.list();
  const announcement = itemTypes.find(
    (itemType) => itemType.api_key === "announcement",
  );
  if (!announcement) {
    console.log("modello `announcement` non presente, salto");
    return;
  }

  const records = [];
  for await (const record of client.items.listPagedIterator({
    filter: { type: announcement.id },
    version: "current",
  }))
    records.push(record.id);

  if (records.length)
    throw new Error(
      `il modello announcement contiene ${records.length} record: cancellali prima del rollback`,
    );

  console.log('Destroy model "Avvisi pubblici" (`announcement`)');
  await client.itemTypes.destroy(announcement.id);
}
