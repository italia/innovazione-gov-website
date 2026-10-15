import { buildClient } from "@datocms/cli/lib/cma-client-node";
import * as dotenv from "dotenv";
import path from "node:path";

dotenv.config({
  path: "/Users/guidosquillace/Repos/innovazione-gov-website/.env",
});

const file = process.argv[2];
if (!file) {
  console.error("Uso: bun applica-migration.ts migrations/<file>.ts");
  process.exit(1);
}

const apiToken = process.env.DATOCMS_MANAGEMENT_API_TOKEN;
const environment = process.env.DATOCMS_ENVIRONMENT;
if (!apiToken || !environment) {
  console.error(
    "Servono DATOCMS_MANAGEMENT_API_TOKEN e DATOCMS_ENVIRONMENT in .env",
  );
  process.exit(1);
}

const client = buildClient({ apiToken, environment });
const target = await client.environments.find(environment);
if (target.meta.primary) {
  console.error(`\`${environment}\` è l'environment primary: non lo tocco.`);
  process.exit(1);
}

const percorso = path.resolve(
  "/Users/guidosquillace/Repos/innovazione-gov-website",
  file,
);
const migration = await import(percorso);
console.log(`applico ${file} su ${environment}`);
await migration.default(client);
console.log("fatto");
