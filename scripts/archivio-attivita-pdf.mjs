import { buildClient } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const COMMIT = process.argv.includes("--commit");
const ARCHIVIO = "BLhVSfscSeuE6BpfW9ljQA";

const client = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: "website-astro-2026",
  requestTimeout: 60000,
});

const TESTI = {
  "Task force Covid-19": {
    duration: "Marzo 2019 - Luglio 2021",
    paragraph:
      "Durante l'emergenza sanitaria il Dipartimento ha coordinato lo sviluppo e l'implementazione di soluzioni digitali a supporto della risposta nazionale alla pandemia. In collaborazione con il Ministero della Salute, la Struttura Commissariale e le istituzioni europee, ha contribuito alla realizzazione di strumenti come Immuni e la Certificazione verde COVID-19 (Green Pass), favorendo l'interoperabilità e il coordinamento tecnologico a livello nazionale ed europeo.",
  },
  "Solidarietà Digitale": {
    duration: "Marzo 2020 - Giugno 2021",
    paragraph:
      "Solidarietà Digitale, nata a marzo 2020 per rispondere all'emergenza sociale ed economica del Covid-19, mette in contatto cittadini, enti ed aziende disposte a fornire gratuitamente servizi innovativi per persone di ogni età.",
  },
  MadeIT: {
    duration: "Marzo 2019 - Marzo 2021",
    paragraph:
      "MadeIT è un'iniziativa governativa interministeriale nata con la volontà di unire l'ecosistema di startup e PMI italiane ad alto potenziale innovativo sotto un unico marchio. La sua missione è quella di valorizzare il Made in Italy tecnologico in Italia e all'estero, con l'ambizione di far emergere le più promettenti imprese italiane ancora poco conosciute e rendere l'Italia un'eccellenza internazionale attraverso la robotica, la mobilità del futuro, l'intelligenza artificiale, la cyber security ed altre tecnologie.",
  },
};

const NUOVA = {
  title: "Italia Digitale 2026",
  slug: "italia-digitale-2026",
  duration: "Marzo 2019 - Luglio 2021",
  paragraph:
    "Italia Digitale 2026 è stata l'iniziativa dedicata ad accompagnare l'attuazione delle misure del Piano Nazionale di Ripresa e Resilienza (PNRR) per la trasformazione digitale della Pubblica Amministrazione. Il portale ha raccolto informazioni, strumenti e opportunità per supportare le amministrazioni nell'accesso ai finanziamenti e nell'attuazione degli interventi previsti.",
};

const tipi = await client.itemTypes.list();
const article = tipi.find((t) => t.api_key === "article").id;

const archiviate = [];
for await (const r of client.items.listPagedIterator({
  filter: {
    type: article,
    fields: { article_type: { eq: "project" }, archived: { eq: true } },
  },
  version: "current",
}))
  archiviate.push(r);

const esistente = archiviate.find(
  (r) => (r.title?.it ?? r.title) === NUOVA.title,
);

console.log(COMMIT ? "scrittura" : "DRY-RUN (usa --commit)");
console.log(`attività archiviate: ${archiviate.length}`);
for (const r of archiviate) {
  const titolo = r.title?.it ?? r.title;
  const testi = TESTI[titolo];
  console.log(
    `  ${titolo}: ${testi ? "durata + paragrafo dal PDF" : `durata ${r.duration ? `"${r.duration}"` : "DA COMPILARE"}`}`,
  );
}
console.log(
  esistente
    ? "  Italia Digitale 2026: già presente"
    : "  Italia Digitale 2026: da creare",
);

if (!COMMIT) process.exit(0);

for (const r of archiviate) {
  const titolo = r.title?.it ?? r.title;
  const testi = TESTI[titolo];
  if (!testi) continue;
  const paragrafo =
    r.paragraph && typeof r.paragraph === "object"
      ? { ...r.paragraph, it: testi.paragraph }
      : { it: testi.paragraph };
  await client.items.update(r.id, {
    duration: testi.duration,
    paragraph: paragrafo,
  });
  if (r.meta.status === "published") await client.items.publish(r.id);
  console.log(`aggiornata: ${titolo}`);
}

if (!esistente) {
  const creata = await client.items.create({
    item_type: { id: article, type: "item_type" },
    title: { it: NUOVA.title },
    slug: { it: NUOVA.slug },
    article_type: "project",
    archived: true,
    duration: NUOVA.duration,
    paragraph: { it: NUOVA.paragraph },
    description: { it: NUOVA.paragraph },
    parent_page: { it: ARCHIVIO },
    show_sidebar: false,
  });
  await client.items.publish(creata.id);
  console.log(`creata e pubblicata: ${NUOVA.title} (${creata.id})`);
}
