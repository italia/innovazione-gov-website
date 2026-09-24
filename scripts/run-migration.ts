// Applica (o annulla con --down) una singola migration di `migrations/` sul
// sandbox indicato da DATOCMS_ENVIRONMENT in .env.staging, usando il token
// DATOCMS_MIGRATION_API_TOKEN. Si rifiuta di toccare l'environment primary:
// lì le migration passano dal flusso fork/promote di `bun migrate`.
//
//   bun ./scripts/run-migration.ts migrations/<file>.ts [--down]
import { buildClient, type Client } from "@datocms/cli/lib/cma-client-node";
import * as dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: ".env.staging" });

type Migration = {
  default: (client: Client) => Promise<void>;
  down?: (client: Client) => Promise<void>;
};

const [, , file, ...flags] = process.argv;
const isDown = flags.includes("--down");
if (!file) {
  console.error(
    "Uso: bun ./scripts/run-migration.ts migrations/<file>.ts [--down]",
  );
  process.exit(1);
}

const apiToken = process.env.DATOCMS_MIGRATION_API_TOKEN;
const environment = process.env.DATOCMS_ENVIRONMENT;
if (!apiToken || !environment) {
  console.error(
    "Servono DATOCMS_MIGRATION_API_TOKEN e DATOCMS_ENVIRONMENT in .env.staging",
  );
  process.exit(1);
}

const client = buildClient({ apiToken, environment });
const target = await client.environments.find(environment);
if (target.meta.primary) {
  console.error(
    `\`${environment}\` è l'environment primary: usa \`bun migrate\` (fork + promote).`,
  );
  process.exit(1);
}

const migration = (await import(path.resolve(file))) as Migration;
if (isDown && !migration.down) {
  console.error(`${file} non esporta \`down\`: rollback non disponibile.`);
  process.exit(1);
}

console.log(
  `${isDown ? "ROLLBACK" : "APPLY"} ${path.basename(file)} on environment \`${environment}\``,
);
await (isDown ? migration.down!(client) : migration.default(client));
console.log("done");
