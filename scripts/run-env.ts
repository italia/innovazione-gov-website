import dotenv from "dotenv";
import { spawnSync } from "node:child_process";

const mode = process.argv[2];
const command = process.argv[3];

if (!mode || !command) {
  console.error("Usage: bun run <staging|production> -- <dev|build>");
  process.exit(1);
}

const envFile = `.env.${mode}`;

dotenv.config({ path: envFile, override: true });

const envName = process.env.DATOCMS_ENVIRONMENT || "main";
const apiUrl = `https://graphql.datocms.com/environments/${envName}`;

const schemaToken =
  process.env.DATOCMS_MANAGEMENT_API_TOKEN ?? process.env.DATOCMS_API_TOKEN;
if (!schemaToken) {
  console.error(
    "Missing token: set DATOCMS_MANAGEMENT_API_TOKEN or DATOCMS_API_TOKEN.",
  );
  process.exit(1);
}

const schemaResult = spawnSync(
  "bun",
  [
    "x",
    "gql.tada",
    "generate",
    "schema",
    apiUrl,
    "--header",
    "X-Exclude-Invalid: true",
    "--header",
    `Authorization: ${schemaToken}`,
  ],
  { stdio: "inherit", env: process.env },
);
if (schemaResult.status !== 0) {
  // gql.tada has a cleanup bug (.unref on non-handle) that causes a non-zero exit
  // even after a successful schema generation; fall through so astro catches real errors
  console.warn(
    `⚠ gql.tada exited ${schemaResult.status} — continuing; check astro output for type errors`,
  );
}

// Keep graphql-env.d.ts in sync with schema.graphql so TS type narrowing stays accurate
const outputResult = spawnSync("bun", ["x", "gql.tada", "generate-output"], {
  stdio: "inherit",
  env: process.env,
});
if (outputResult.status !== 0) {
  console.warn(
    `⚠ gql.tada generate-output exited ${outputResult.status} — types may be stale`,
  );
}

const linksResult = spawnSync("bun", ["./scripts/generate-link-map.ts"], {
  stdio: "inherit",
  env: process.env,
});
if (linksResult.status !== 0) {
  process.exit(linksResult.status ?? 1);
}

// For `check`, capture output so we can detect transient network failures
// and not fail the commit when DatoCMS staging is temporarily unreachable.
const isCheck = command === "check";
const astroResult = spawnSync(
  "bun",
  ["x", "astro", command, "--mode", mode, ...process.argv.slice(4)],
  { stdio: isCheck ? "pipe" : "inherit", env: process.env },
);

if (isCheck) {
  const out =
    (astroResult.stdout?.toString() ?? "") +
    (astroResult.stderr?.toString() ?? "");
  process.stdout.write(astroResult.stdout ?? "");
  process.stderr.write(astroResult.stderr ?? "");
  if (
    astroResult.status !== 0 &&
    (out.includes("Connect Timeout Error") || out.includes("fetch failed"))
  ) {
    console.warn(
      "⚠ DatoCMS staging unreachable — content sync failed, type check skipped",
    );
    process.exit(0);
  }
}

process.exit(astroResult.status ?? 1);
