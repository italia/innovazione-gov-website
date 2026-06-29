import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client): Promise<void> {
  console.log("Create block models");

  console.log('Create block model "Carousel Slide" (`carousel_slide`)');
  const carouselSlideBlock = await client.itemTypes.create(
    {
      name: "Carousel Slide",
      api_key: "carousel_slide",
      modular_block: true,
      draft_saving_active: false,
      hint: "Singola slide del carosello missioni PNRR",
      inverse_relationships_enabled: false,
    },
    { skip_menu_item_creation: true },
  );

  console.log("Create fields for carousel_slide");

  await client.fields.create(carouselSlideBlock, {
    label: "Titolo",
    api_key: "title",
    field_type: "string",
    validators: { required: {} },
    appearance: {
      addons: [],
      editor: "single_line",
      parameters: { heading: true, placeholder: null },
    },
    default_value: null,
  });

  await client.fields.create(carouselSlideBlock, {
    label: "Descrizione",
    api_key: "body",
    field_type: "text",
    hint: "Testo descrittivo della slide (opzionale)",
    appearance: {
      addons: [],
      editor: "markdown",
      parameters: {
        toolbar: ["bold", "italic", "link", "unordered_list", "fullscreen"],
      },
    },
    default_value: null,
  });

  await client.fields.create(carouselSlideBlock, {
    label: "Immagine di sfondo",
    api_key: "image",
    field_type: "file",
    validators: {
      required: {},
      extension: { predefined_list: "image" },
    },
    appearance: { addons: [], editor: "file", parameters: {} },
  });

  await client.itemTypes.update(carouselSlideBlock, {
    presentation_title_field: null,
  });

  console.log('Create block model "Carousel Missioni" (`carousel`)');
  const carouselMissionsBlock = await client.itemTypes.create(
    {
      name: "Carousel Missioni",
      api_key: "carousel",
      modular_block: true,
      draft_saving_active: false,
      hint: "Carosello di slide per le missioni PNRR",
      inverse_relationships_enabled: false,
    },
    { skip_menu_item_creation: true },
  );

  await client.fields.create(carouselMissionsBlock, {
    label: "Slide",
    api_key: "slides",
    field_type: "rich_text",
    validators: {
      rich_text_blocks: {
        item_types: [carouselSlideBlock.id],
      },
      size: { min: 1 },
    },
    appearance: {
      addons: [],
      editor: "rich_text",
      parameters: { start_collapsed: false },
    },
  });

  console.log("Add carousel_missions to Page content field");
  await client.fields.update("GF7gIgNTSi6ithc2WsLnyg", {
    validators: {
      rich_text_blocks: {
        item_types: [
          "Awg0gTrzT1WtWycAQ5I-cw",
          "BqiyK44MT9eCdscz8pcESg",
          "BttQ-GOdSDCjRZinK2Hevw",
          "EAJfEdPjRVy9SJIOnQDM_w",
          "ISQ-koGkTSSMpTeQ7yX72w",
          "PtFD-_7RS_6HmJAq7R2c9g",
          "RH3d7bWeSlSt4w-W7s3_wg",
          "R9Sa8uDfTpSRaWMISQiDFg",
          "SC9fd201RBSV7s31u6zCKg",
          "UKWQ1GcrSWy1u0UVIWhNLg",
          "X161uMKbRhmHJinyurEdyQ",
          "Y90FAsoITzyeuRK7Q4PtiQ",
          "b0T_r6aaQMSUIrtOBO4ZTQ",
          "c2sA3G6uT_q4EBkYwbUqaw",
          "eYC6ITddSYSZVRiO1Ldt3g",
          "eoeVTiI4S362w9-yoe7i6g",
          carouselMissionsBlock.id,
        ],
      },
    },
  });

  console.log("Add carousel to Homepage content field");
  await client.fields.update("WZVHotolRE6evlVhD7wjTg", {
    validators: {
      rich_text_blocks: {
        item_types: [
          "Awg0gTrzT1WtWycAQ5I-cw",
          "BttQ-GOdSDCjRZinK2Hevw",
          "PtFD-_7RS_6HmJAq7R2c9g",
          "RH3d7bWeSlSt4w-W7s3_wg",
          "R9Sa8uDfTpSRaWMISQiDFg",
          "U50kKrnkSua6L3eIAEFHhA",
          "Y90FAsoITzyeuRK7Q4PtiQ",
          "eYC6ITddSYSZVRiO1Ldt3g",
          carouselMissionsBlock.id,
        ],
      },
    },
  });
}
