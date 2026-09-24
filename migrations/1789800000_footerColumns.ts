import { Client } from "@datocms/cli/lib/cma-client-node";

// Footer come da design: colonna "Contatti" (titolo + indirizzo) e colonne di
// link titolate ("Altri siti web", "Trasparenza"). I social restano nel campo
// `utility`, la barra finale in `small_print`.
//
// Solo aggiunte: un blocco `footer_column` e tre campi sul modello `layout`,
// dentro il fieldset "Footer". `down` rimuove esattamente quello che `up`
// ha creato (e nient'altro): da lanciare con
//   bun ./scripts/run-migration.ts migrations/1789800000_footerColumns.ts --down

const FOOTER_COLUMN_API_KEY = "footer_column";
const LAYOUT_FIELDS = ["footer_columns", "contact_title", "contact_address"];

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const find = (apiKey: string) =>
    itemTypes.find((itemType) => itemType.api_key === apiKey);

  const layout = find("layout");
  const internalLink = find("internal_link");
  const externalLink = find("external_link");
  if (!layout || !internalLink || !externalLink)
    throw new Error(
      "modelli layout, internal_link o external_link non trovati",
    );

  const fieldsets = await client.fieldsets.list(layout.id);
  const footerFieldset = fieldsets.find((fieldset) =>
    fieldset.title.toLowerCase().includes("footer"),
  );
  if (!footerFieldset)
    throw new Error('fieldset "Footer" non trovato sul modello layout');

  let footerColumn = find(FOOTER_COLUMN_API_KEY);
  if (!footerColumn) {
    console.log('Create block model "Colonna del footer" (`footer_column`)');
    footerColumn = await client.itemTypes.create({
      name: "Colonna del footer",
      api_key: FOOTER_COLUMN_API_KEY,
      modular_block: true,
      hint: "Una colonna di link del footer, con il suo titolo (es. Altri siti web, Trasparenza).",
    });

    console.log(
      'Create Single-line string field "Titolo" (`title`) in block "Colonna del footer"',
    );
    await client.fields.create(footerColumn.id, {
      label: "Titolo",
      api_key: "title",
      field_type: "string",
      hint: "Intestazione della colonna. Se vuoto, la colonna mostra solo i link.",
      validators: {},
      appearance: {
        addons: [],
        editor: "single_line",
        parameters: { heading: false },
      },
    });

    console.log(
      'Create Modular Content field "Link" (`links`) in block "Colonna del footer"',
    );
    await client.fields.create(footerColumn.id, {
      label: "Link",
      api_key: "links",
      field_type: "rich_text",
      hint: "I link della colonna, interni o esterni, nell'ordine in cui compaiono.",
      validators: {
        rich_text_blocks: { item_types: [internalLink.id, externalLink.id] },
        size: { min: 1 },
      },
      appearance: {
        addons: [],
        editor: "rich_text",
        parameters: { start_collapsed: false },
      },
    });
  } else {
    console.log("`footer_column` già presente");
  }

  const fields = await client.fields.list(layout.id);
  const has = (apiKey: string) =>
    fields.some((field) => field.api_key === apiKey);
  const fieldset = { type: "fieldset" as const, id: footerFieldset.id };

  if (!has("contact_title")) {
    console.log(
      'Create Single-line string field "Contatti: titolo" (`contact_title`) in model "Layout"',
    );
    await client.fields.create(layout.id, {
      label: "Contatti: titolo",
      api_key: "contact_title",
      field_type: "string",
      localized: true,
      hint: "Intestazione della prima colonna del footer (es. Contatti).",
      validators: {},
      appearance: {
        addons: [],
        editor: "single_line",
        parameters: { heading: false },
      },
      fieldset,
    });
  }

  if (!has("contact_address")) {
    console.log(
      'Create Multiple-paragraph text field "Contatti: indirizzo" (`contact_address`) in model "Layout"',
    );
    await client.fields.create(layout.id, {
      label: "Contatti: indirizzo",
      api_key: "contact_address",
      field_type: "text",
      localized: true,
      hint: "Indirizzo della sede, una riga per andata a capo. Mostrato sotto il titolo con l'icona dell'edificio.",
      validators: {},
      appearance: { addons: [], editor: "textarea", parameters: {} },
      fieldset,
    });
  }

  if (!has("footer_columns")) {
    console.log(
      'Create Modular Content field "Colonne di link" (`footer_columns`) in model "Layout"',
    );
    await client.fields.create(layout.id, {
      label: "Colonne di link",
      api_key: "footer_columns",
      field_type: "rich_text",
      localized: true,
      hint: "Le colonne di link accanto a Contatti e Seguici su (es. Altri siti web, Trasparenza).",
      validators: {
        rich_text_blocks: { item_types: [footerColumn.id] },
      },
      appearance: {
        addons: [],
        editor: "rich_text",
        parameters: { start_collapsed: true },
      },
      fieldset,
    });
  }
}

/** Rollback: toglie i tre campi da `layout` e poi il blocco `footer_column`. */
export async function down(client: Client) {
  const itemTypes = await client.itemTypes.list();
  const layout = itemTypes.find((itemType) => itemType.api_key === "layout");
  if (!layout) throw new Error("modello layout non trovato");

  const fields = await client.fields.list(layout.id);
  for (const apiKey of LAYOUT_FIELDS) {
    const field = fields.find((field) => field.api_key === apiKey);
    if (!field) {
      console.log(`\`${apiKey}\` non presente su layout, salto`);
      continue;
    }
    console.log(`Destroy field \`${apiKey}\` from model "Layout"`);
    await client.fields.destroy(field.id);
  }

  const footerColumn = itemTypes.find(
    (itemType) => itemType.api_key === FOOTER_COLUMN_API_KEY,
  );
  if (!footerColumn) {
    console.log("`footer_column` non presente, salto");
    return;
  }
  console.log('Destroy block model "Colonna del footer" (`footer_column`)');
  await client.itemTypes.destroy(footerColumn.id);
}
