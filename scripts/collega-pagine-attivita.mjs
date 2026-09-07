import { buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const commit = process.argv.includes("--commit");
const linkMap = JSON.parse(
  await (
    await import("node:fs/promises")
  ).readFile("src/data/linkMap.json", "utf8"),
);

const c = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: "website-astro-2026",
  requestTimeout: 120000,
});
const types = await c.itemTypes.list();
const id = (key) => types.find((t) => t.api_key === key).id;

const percorso = (recordId) => linkMap[recordId]?.it?.path ?? null;

const pagine = [];
for (const modello of ["article", "insight"]) {
  for await (const rec of c.items.listPagedIterator({
    filter: { type: id(modello) },
    version: "current",
  })) {
    const parent = rec.parent_page?.it;
    if (!parent) continue;
    const p = percorso(rec.id);
    if (!p || !p.startsWith("/it/attivita")) continue;
    pagine.push({ id: rec.id, modello, titolo: rec.title.it, percorso: p });
  }
}

const TERMINI = [
  { regex: /\bapp IO\b/i, slug: "app-io" },
  { regex: /\bIT-Wallet\b/, slug: "sistema-it-wallet" },
  { regex: /\bANPR\b/, slug: "anagrafe-nazionale-della-popolazione-residente" },
  { regex: /\bPDND\b/, slug: "piattaforma-digitale-nazionale-dati" },
  { regex: /\bINAD\b/, slug: "inad" },
  { regex: /\bANSC\b/, slug: "ansc" },
  { regex: /\bSEND\b/, slug: "send" },
  { regex: /\bDesigners Italia\b/, slug: "designers-italia" },
  { regex: /\bDevelopers Italia\b/, slug: "developers-italia" },
  { regex: /\bRepubblica Digitale\b/i, slug: "repubblica-digitale" },
  { regex: /\bSperimentazione Italia\b/, slug: "sperimentazione-italia" },
  { regex: /\bSmarter Italy\b/, slug: "smarter-italy" },
  { regex: /\bReti ultraveloci\b/i, slug: "reti-ultraveloci" },
  {
    regex: /\bInfrastrutture digitali e cloud\b/i,
    slug: "infrastrutture-digitali-e-cloud",
  },
  { regex: /\bpagoPA\b(?!\s*S\.p\.A)/i, slug: "pagopa" },
  { regex: /\bSPID\b/, slug: "identita-digitale-spid-cie" },
];

const perSlug = new Map();
for (const p of pagine) perSlug.set(p.percorso.split("/").at(-1), p);

const conteggio = [];
for (const pagina of pagine) {
  const rec = await c.items.find(pagina.id, {
    version: "current",
    nested: true,
  });
  const doc = rec.content?.it?.document;
  if (!doc) continue;
  const trovati = new Map();

  const giaCollegati = new Set();
  const raccogliLink = (nodi) => {
    for (const n of nodi ?? []) {
      if (n.type === "link" && n.url)
        giaCollegati.add(n.url.replace(/\/$/, ""));
      raccogliLink(n.children);
    }
  };
  raccogliLink(doc.children);

  const spezza = (span) => {
    for (const t of TERMINI) {
      const destinazione = perSlug.get(t.slug);
      if (!destinazione || destinazione.id === pagina.id) continue;
      if (trovati.has(t.slug)) continue;
      if (giaCollegati.has(destinazione.percorso.replace(/\/$/, ""))) continue;
      const m = t.regex.exec(span.value ?? "");
      if (!m) continue;
      trovati.set(t.slug, m[0]);
      const prima = span.value.slice(0, m.index);
      const dopo = span.value.slice(m.index + m[0].length);
      const marks = span.marks ? { marks: span.marks } : {};
      const pezzi = [];
      if (prima)
        pezzi.push(...spezza({ type: "span", ...marks, value: prima }));
      pezzi.push({
        type: "link",
        url: destinazione.percorso,
        children: [{ type: "span", ...marks, value: m[0] }],
      });
      if (dopo) pezzi.push(...spezza({ type: "span", ...marks, value: dopo }));
      return pezzi;
    }
    return [span];
  };

  const trasforma = (nodi) =>
    (nodi ?? []).flatMap((n) => {
      if (n.type === "heading" || n.type === "link" || n.type === "itemLink")
        return [n];
      if (n.type === "block")
        return [
          {
            type: "block",
            item: typeof n.item === "object" ? n.item.id : n.item,
          },
        ];
      if (n.type === "span") return spezza(n);
      return [{ ...n, children: trasforma(n.children) }];
    });

  const children = trasforma(doc.children);
  if (!trovati.size) continue;
  conteggio.push({ pagina, trovati });
  if (!commit) continue;
  await c.items.update(pagina.id, {
    content: { it: { schema: "dast", document: { type: "root", children } } },
  });
  if (rec.meta.status === "published") await c.items.publish(pagina.id);
}

for (const { pagina, trovati } of conteggio) {
  console.log(`\n${pagina.percorso}`);
  for (const [slug, testo] of trovati)
    console.log(`   "${testo}" -> ${perSlug.get(slug).percorso}`);
}
console.log(
  commit
    ? "\n--- link inseriti e pagine ripubblicate ---"
    : "\n--- anteprima, nessuna modifica ---",
);
console.log(
  `pagine sotto Attività: ${pagine.length} | pagine con link da aggiungere: ${conteggio.length} | link totali: ${conteggio.reduce((s, x) => s + x.trovati.size, 0)}`,
);
