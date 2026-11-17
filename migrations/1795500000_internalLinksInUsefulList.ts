import {
  Client,
  type RichTextFieldValidators,
} from "@datocms/cli/lib/cma-client-node";

function accettaBlocchi(
  validators: object,
): validators is RichTextFieldValidators {
  return "rich_text_blocks" in validators;
}

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();

  const listExternalLink = itemTypes.find(
    (itemType) => itemType.api_key === "list_external_link",
  );
  if (!listExternalLink)
    throw new Error("blocco list_external_link non trovato");

  const internalLink = itemTypes.find(
    (itemType) => itemType.api_key === "internal_link",
  );
  if (!internalLink) throw new Error("blocco internal_link non trovato");

  const fields = await client.fields.list(listExternalLink.id);
  const links = fields.find((field) => field.api_key === "links");
  if (!links) throw new Error("campo links non trovato");

  if (!accettaBlocchi(links.validators)) {
    throw new Error("campo links senza validator rich_text_blocks");
  }

  const ammessi = links.validators.rich_text_blocks.item_types;
  if (ammessi.includes(internalLink.id)) {
    console.log("`internal_link` già ammesso nella lista dei collegamenti");
    return;
  }

  console.log("Allow internal_link inside the useful links list");
  await client.fields.update(links.id, {
    label: "Collegamenti",
    hint: "Ogni voce può portare a una pagina del sito (Internal link) o a un sito esterno (External link). L'icona del link esterno compare solo sulle seconde.",
    validators: {
      ...links.validators,
      rich_text_blocks: { item_types: [...ammessi, internalLink.id] },
    },
  });
}
