import { Client } from "@datocms/cli/lib/cma-client-node";

// "Gestione Cookie" nella barra finale del footer porta alla sezione cookie
// della privacy policy (#cookies-management): un InternalLink deve poter
// indicare un'ancora nella pagina. Campo opzionale, solo aggiunta; `down` lo
// toglie:
//   bun ./scripts/run-migration.ts migrations/1789900000_internalLinkAnchor.ts --down

const FIELD_API_KEY = "anchor";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const internalLink = itemTypes.find(
    (itemType) => itemType.api_key === "internal_link",
  );
  if (!internalLink) throw new Error("blocco internal_link non trovato");

  const fields = await client.fields.list(internalLink.id);
  if (fields.some((field) => field.api_key === FIELD_API_KEY)) {
    console.log("`anchor` già presente su internal_link");
    return;
  }

  console.log(
    'Create Single-line string field "Ancora" (`anchor`) in block "Internal link"',
  );
  await client.fields.create(internalLink.id, {
    label: "Ancora",
    api_key: FIELD_API_KEY,
    field_type: "string",
    hint: "Facoltativa: id della sezione della pagina a cui portare, senza cancelletto (es. cookies-management).",
    validators: {
      format: { custom_pattern: "^[A-Za-z][A-Za-z0-9_-]*$" },
    },
    appearance: {
      addons: [],
      editor: "single_line",
      parameters: { heading: false, placeholder: "cookies-management" },
    },
  });
}

/** Rollback: toglie il campo `anchor` da internal_link. */
export async function down(client: Client) {
  const itemTypes = await client.itemTypes.list();
  const internalLink = itemTypes.find(
    (itemType) => itemType.api_key === "internal_link",
  );
  if (!internalLink) throw new Error("blocco internal_link non trovato");
  const fields = await client.fields.list(internalLink.id);
  const anchor = fields.find((field) => field.api_key === FIELD_API_KEY);
  if (!anchor) {
    console.log("`anchor` non presente, salto");
    return;
  }
  console.log('Destroy field `anchor` from block "Internal link"');
  await client.fields.destroy(anchor.id);
}
