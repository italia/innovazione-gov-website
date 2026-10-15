import { Client } from "@datocms/cli/lib/cma-client-node";

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();
  const page = itemTypes.find((itemType) => itemType.api_key === "page");
  const search = itemTypes.find((itemType) => itemType.api_key === "search");
  if (!page || !search) throw new Error("modelli page o search non trovati");

  const contenutoPagina = (await client.fields.list(page.id)).find(
    (field) => field.api_key === "content",
  );
  const contenutoRicerca = (await client.fields.list(search.id)).find(
    (field) => field.api_key === "content",
  );
  if (!contenutoPagina || !contenutoRicerca)
    throw new Error("campo content non trovato");

  const ammessi = (validators: unknown): string[] =>
    typeof validators === "object" &&
    validators !== null &&
    "rich_text_blocks" in validators &&
    Array.isArray(
      (validators as { rich_text_blocks?: { item_types?: unknown } })
        .rich_text_blocks?.item_types,
    )
      ? (validators as { rich_text_blocks: { item_types: string[] } })
          .rich_text_blocks.item_types
      : [];

  const dallaPagina = ammessi(contenutoPagina.validators);
  const giaNellaRicerca = ammessi(contenutoRicerca.validators);
  const unione = [
    ...giaNellaRicerca,
    ...dallaPagina.filter((id) => !giaNellaRicerca.includes(id)),
  ];
  if (unione.length === giaNellaRicerca.length) return;

  console.log(
    `Update Modular content field "content" in model "Search" to accept ${unione.length} blocks`,
  );
  await client.fields.update(contenutoRicerca.id, {
    validators: { rich_text_blocks: { item_types: unione } },
  });
}
