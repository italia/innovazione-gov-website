import { buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const client = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  requestTimeout: 60000,
});

const maintenance = await client.maintenanceMode.find();
console.log("maintenance mode:", maintenance.active ? "attiva" : "spenta");

const environments = await client.environments.list();
const primary = environments.find((environment) => environment.meta.primary);
console.log("primario adesso:", primary?.id);

if (primary?.id !== "main") {
  await client.environments.promote("main");
  console.log("main promosso a primario");
}

if (maintenance.active) {
  await client.maintenanceMode.deactivate();
  console.log("maintenance mode disattivata");
}

for (const environment of await client.environments.list()) {
  console.log(` ${environment.id} primario=${environment.meta.primary}`);
}
