import fs from "node:fs";
const env = Object.fromEntries(
  fs
    .readFileSync(".env", "utf8")
    .split("\n")
    .filter((r) => r.includes("=") && !r.trim().startsWith("#"))
    .map((r) => {
      const i = r.indexOf("=");
      return [
        r.slice(0, i).trim(),
        r
          .slice(i + 1)
          .trim()
          .replace(/^["']|["']$/g, ""),
      ];
    }),
);
const interroga = async (q, v = {}) => {
  const res = await fetch("https://graphql.datocms.com/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.DATOCMS_API_TOKEN}`,
      "X-Environment": env.DATOCMS_ENVIRONMENT,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: q, variables: v }),
  });
  const j = await res.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors).slice(0, 300));
  return j.data;
};
const tutti = [];
for (let skip = 0; ; skip += 100) {
  const d = await interroga(
    `query($skip: IntType!){ allArticles(first:100, skip:$skip){ slug articleType attachments { id fileTitle file { url } } } }`,
    { skip },
  );
  tutti.push(...d.allArticles);
  if (d.allArticles.length < 100) break;
}
const conAllegati = tutti.filter((a) => (a.attachments ?? []).length);
const totale = conAllegati.reduce((s, a) => s + a.attachments.length, 0);
const senzaFile = conAllegati.flatMap((a) =>
  a.attachments.filter((x) => !x.file),
);
console.log(`articoli pubblicati: ${tutti.length}`);
console.log(`articoli con allegati: ${conAllegati.length}`);
console.log(`allegati totali in pagina: ${totale}`);
console.log(`allegati senza file: ${senzaFile.length}`);
for (const a of conAllegati.slice(0, 6))
  console.log(`   ${a.attachments.length}x  /${a.slug}`);
