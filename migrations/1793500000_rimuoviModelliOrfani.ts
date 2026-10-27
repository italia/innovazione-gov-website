import { Client } from "@datocms/cli/lib/cma-client-node";

const CAMPI_DA_RIMUOVERE: { itemType: string; field: string }[] = [
  { itemType: "insight", field: "topic" },
];

const MODELLI_DA_RIMUOVERE = ["fetch_item", "goals_achived", "insight_topic"];

export default async function (client: Client) {
  const itemTypes = await client.itemTypes.list();

  for (const { itemType: apiKey, field: fieldApiKey } of CAMPI_DA_RIMUOVERE) {
    const itemType = itemTypes.find(
      (candidato) => candidato.api_key === apiKey,
    );
    if (!itemType) {
      console.log(`Model "${apiKey}" not found, skipping field removal`);
      continue;
    }

    const fields = await client.fields.list(itemType.id);
    const field = fields.find((candidato) => candidato.api_key === fieldApiKey);
    if (!field) {
      console.log(`Field "${apiKey}.${fieldApiKey}" not found, skipping`);
      continue;
    }

    console.log(`Destroy field "${apiKey}.${fieldApiKey}"`);
    await client.fields.destroy(field.id);
  }

  for (const apiKey of MODELLI_DA_RIMUOVERE) {
    const itemType = itemTypes.find(
      (candidato) => candidato.api_key === apiKey,
    );
    if (!itemType) {
      console.log(`Model "${apiKey}" not found, skipping`);
      continue;
    }

    const { meta } = await client.items.rawList({
      filter: { type: apiKey },
      page: { limit: 1 },
    });
    if (meta.total_count > 0) {
      throw new Error(
        `Model "${apiKey}" still holds ${meta.total_count} records: aborting instead of deleting content`,
      );
    }

    console.log(`Destroy model "${apiKey}"`);
    await client.itemTypes.destroy(itemType.id);
  }
}
