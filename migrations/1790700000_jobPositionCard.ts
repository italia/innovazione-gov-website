import { Client } from "@datocms/cli/lib/cma-client-node";

const VALORI_ULTIMI_ELEMENTI = [
  "news",
  "press_release",
  "focus",
  "guida",
  "articles",
  "focus_page",
  "interview",
  "participation",
  "project",
  "job_position",
];

const OPZIONI_ULTIMI_ELEMENTI = [
  { hint: "", label: "Notizie", value: "news" },
  { hint: "", label: "Comunicati stampa", value: "press_release" },
  { hint: "", label: "Focus", value: "focus" },
  { hint: "", label: "Guide", value: "guida" },
  { hint: "", label: "Interviste", value: "interview" },
  { hint: "", label: "Articoli (tutti)", value: "articles" },
  { hint: "", label: "Attività (progetti)", value: "project" },
  {
    hint: "Solo le selezioni ancora aperte, dalla più recente.",
    label: "Posizioni lavorative aperte",
    value: "job_position",
  },
];

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const jobPosition = itemTypes.find(
    (itemType) => itemType.api_key === "job_position",
  );
  const cardLinkList = itemTypes.find(
    (itemType) => itemType.api_key === "card_link_list",
  );
  if (!jobPosition || !cardLinkList)
    throw new Error("modelli job_position o card_link_list non trovati");

  const campiPosizione = await client.fields.list(jobPosition.id);
  if (!campiPosizione.some((field) => field.api_key === "image")) {
    console.log(
      'Create Single asset field "Immagine" (`image`) in model "Posizione lavorativa" (`job_position`)',
    );
    await client.fields.create(jobPosition.id, {
      label: "Immagine",
      api_key: "image",
      field_type: "file",
      hint: "L'illustrazione della card nel blocco che elenca le posizioni aperte. Senza immagine la card resta di solo testo.",
      validators: {},
      appearance: { addons: [], editor: "file", parameters: {} },
      position: campiPosizione.length + 1,
    });
  }

  const ultimiElementi = (await client.fields.list(cardLinkList.id)).find(
    (field) => field.api_key === "last_items",
  );
  if (ultimiElementi) {
    console.log(
      'Update Single-line string field "3 automatic last items" (`last_items`) with the open job positions option',
    );
    await client.fields.update(ultimiElementi.id, {
      validators: { enum: { values: VALORI_ULTIMI_ELEMENTI } },
      appearance: {
        addons: [],
        editor: "string_select",
        parameters: { options: OPZIONI_ULTIMI_ELEMENTI },
      },
    });
  }
}
