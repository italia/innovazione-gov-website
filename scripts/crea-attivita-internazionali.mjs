import { buildClient, buildBlockRecord } from "@datocms/cma-client-node";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const client = buildClient({
  apiToken: process.env.DATOCMS_MANAGEMENT_API_TOKEN,
  environment: "website-astro-2026",
});

const PAGINA_PADRE = "B1VB0a8aTBqLt416rgX5-A";
const ICONA_BANDIERA =
  "https://www.datocms-assets.com/217545/1792678348-bandiera.svg";

const TIPI = {
  noteBox: "YRVr3UPdQqmgx2vHFVSt5A",
  listCardEditorialWithIcon: "IRda12RgS6maZGJoAyWaKw",
  cardEditorialWithIcon: "P2lZlFmYQQKAy4hJdlrI8g",
  orderedList: "bSjFz6cBSnWfCOaqR-RWVg",
  listItemResource: "FJOsrYfbS-exzcFGaLnqEA",
  listExternalLink: "Vtse6ZCgT2uB4Uh3wh0ikg",
  externalLink: "fhF1HPNNQlKNy5KNGfLtuw",
};

const URL = {
  consiglioTte: "https://www.consilium.europa.eu/it/meetings/tte/2026/06/09/",
  dichiarazioneTrento:
    "https://assets.innovazione.gov.it/1710505409-final-version_declaration.pdf",
  comunicatoCernobbio:
    "https://assets.innovazione.gov.it/1728987577-final-g7-digital-joint-ministerial-statement-15_10_24.pdf",
  toolkitIa:
    "https://www.oecd.org/en/publications/g7-toolkit-for-artificial-intelligence-in-the-public-sector_421c1244-en.html",
  compendioServizi:
    "https://www.oecd.org/en/publications/g7-compendium-of-digital-government-services_69fbf288-en.html",
  mappaturaIdentita:
    "https://www.oecd.org/en/publications/g7-mapping-exercise-of-digital-identity-approaches_56fd4e94-en.html",
  haipOverview: "https://oecd.ai/en/transparency/overview",
  haipBrand: "https://oecd.ai/en/transparency/haip-brand",
  haipVersione2:
    "https://www.oecd.org/en/about/news/press-releases/2026/05/oecd-launches-streamlined-hiroshima-ai-process-reporting-framework-to-help-small-and-medium-sized-enterprises-participate.html",
  sintesiPilota:
    "https://assets.innovazione.gov.it/1728987712-final-overview-of-the-oecd-pilot-of-the-haip-reporting-framework.pdf",
  g20Compendio:
    "https://www.oecd.org/en/publications/g20-compendium-on-the-use-of-digital-tools-for-public-service-continuity_6f800fd5-en.html",
  g20Identita:
    "https://www.oecd.org/en/publications/g20-collection-of-digital-identity-practices_75223806-en.html",
  g20Survey:
    "https://www.oecd.org/en/publications/g20-survey-on-agile-approaches-to-the-regulatory-governance-of-innovation_f161916d-en.html",
  dpcmIgf:
    "https://assets.innovazione.gov.it/1705421573-all-1-dpcm-12-ottobre-2023-all_1.pdf",
  igf2026: "https://www.igf2026.unina.it/",
  agidIgf:
    "https://www.agid.gov.it/it/notizie/igf-italia-2026-definito-il-programma-delle-sessioni",
};

const testo = (value) => ({ type: "span", value });
const collegamento = (value, url) => ({
  type: "link",
  url,
  children: [testo(value)],
});
const paragrafo = (...children) => ({ type: "paragraph", children });
const titolo = (level, value) => ({
  type: "heading",
  level,
  children: [testo(value)],
});
const elenco = (...voci) => ({
  type: "list",
  style: "bulleted",
  children: voci.map((voce) => ({
    type: "listItem",
    children: [
      Array.isArray(voce)
        ? { type: "paragraph", children: voce }
        : paragrafo(testo(voce)),
    ],
  })),
});
const blocco = (item) => ({ type: "block", item });

const cardConIcona = (voci) =>
  buildBlockRecord({
    item_type: { type: "item_type", id: TIPI.listCardEditorialWithIcon },
    title: "",
    items: voci.map((voce) =>
      buildBlockRecord({
        item_type: { type: "item_type", id: TIPI.cardEditorialWithIcon },
        title: voce.titolo,
        description: voce.descrizione,
        icon_select: ICONA_BANDIERA,
      }),
    ),
  });

const elencoNumerato = (voci) =>
  buildBlockRecord({
    item_type: { type: "item_type", id: TIPI.orderedList },
    items: voci.map((voce) =>
      buildBlockRecord({
        item_type: { type: "item_type", id: TIPI.listItemResource },
        title: voce.titolo,
        paragraph: voce.testo,
        subtitle: "",
        links: [],
      }),
    ),
  });

const notaDaTenereAMente = (titolo, testo) =>
  buildBlockRecord({
    item_type: { type: "item_type", id: TIPI.noteBox },
    title: titolo,
    paragraph: testo,
  });

const collegamentiUtili = (voci) =>
  buildBlockRecord({
    item_type: { type: "item_type", id: TIPI.listExternalLink },
    title: "Collegamenti utili",
    links: voci.map((voce) =>
      buildBlockRecord({
        item_type: { type: "item_type", id: TIPI.externalLink },
        label: voce.etichetta,
        url: voce.url,
        description: "",
      }),
    ),
  });

const g7 = [
  titolo(3, "Il contributo del DTD ai lavori del G7"),
  paragrafo(
    testo(
      "Il Dipartimento per la trasformazione digitale contribuisce, nelle materie di propria competenza e in raccordo con le altre amministrazioni italiane coinvolte, ai lavori del G7 dedicati alla trasformazione digitale e alle nuove tecnologie.",
    ),
  ),
  paragrafo(
    testo(
      "L’obiettivo è promuovere una trasformazione digitale sicura, sostenibile e inclusiva, capace di migliorare i servizi pubblici e la vita delle persone, nel rispetto dei valori democratici, dei diritti umani e delle libertà fondamentali.",
    ),
  ),
  titolo(3, "Il G7 e il filone Digitale e Tecnologia"),
  paragrafo(
    testo(
      "Il G7 è un forum informale che riunisce Italia, Francia, Germania, Stati Uniti, Canada, Regno Unito e Giappone. Ai lavori partecipa anche l’Unione europea.",
    ),
  ),
  paragrafo(
    testo(
      "Il G7 non dispone di un segretariato permanente. La Presidenza viene esercitata a rotazione annuale da uno dei Paesi membri, che definisce le priorità, organizza le riunioni e coordina la preparazione dei documenti condivisi.",
    ),
  ),
  paragrafo(
    testo(
      "Nel filone Digitale e Tecnologia, i Paesi del G7 si confrontano sulle opportunità e sulle sfide poste dalla trasformazione digitale. Le riunioni ministeriali sono preparate dal gruppo di lavoro G7 Digitale e Tecnologia, il Digital and Technology Working Group (D&TWG), al quale partecipano, per l’Italia, le amministrazioni competenti, tra cui il Dipartimento per la trasformazione digitale e il Ministero delle Imprese e del Made in Italy.",
    ),
  ),
  paragrafo(
    testo(
      "A seconda delle priorità definite dalla Presidenza di turno, i lavori riguardano, tra gli altri:",
    ),
  ),
  elenco(
    "l’intelligenza artificiale e le tecnologie emergenti;",
    "il governo digitale, i servizi pubblici digitali e l’identità digitale;",
    "i flussi transfrontalieri di dati basati sulla fiducia;",
    "la sicurezza e la resilienza delle infrastrutture, delle reti e delle catene di approvvigionamento digitali;",
    "l’inclusione digitale e l’impiego delle tecnologie per uno sviluppo sostenibile.",
  ),
  titolo(3, "La partecipazione italiana: competenze complementari"),
  paragrafo(
    testo(
      "La partecipazione dell’Italia al filone Digitale e Tecnologia coinvolge più amministrazioni, ciascuna per i rispettivi ambiti di competenza.",
    ),
  ),
  blocco(
    cardConIcona([
      {
        titolo: "Dipartimento per la trasformazione digitale",
        descrizione:
          "Contribuisce in particolare ai lavori sull’uso dell’intelligenza artificiale nel settore pubblico, sul governo digitale, sui servizi pubblici digitali e sull’identità digitale.",
      },
      {
        titolo: "Il Ministero delle Imprese e del Made in Italy",
        descrizione:
          "Partecipa, tra l’altro, ai lavori riguardanti l’applicazione delle tecnologie emergenti al sistema produttivo, la competitività industriale, le reti e le catene di approvvigionamento strategiche.",
      },
    ]),
  ),
  paragrafo(
    testo(
      "Questa collaborazione consente all’Italia di affrontare la trasformazione digitale con una prospettiva integrata, mettendo in relazione innovazione del settore pubblico, sviluppo tecnologico e crescita del sistema produttivo.",
    ),
  ),
  titolo(3, "La Presidenza italiana del G7 nel 2024"),
  paragrafo(
    testo(
      "Dal 1° gennaio al 31 dicembre 2024, l’Italia ha esercitato per la settima volta la Presidenza del G7.",
    ),
  ),
  paragrafo(
    testo(
      "La prima riunione ministeriale dell’anno, dedicata a Industria, Tecnologia e Digitale, si è svolta il 14 e 15 marzo tra Verona e Trento. La giornata di Verona, incentrata sui temi dell’industria e dell’innovazione tecnologica, è stata presieduta dal Ministro delle Imprese e del Made in Italy, Adolfo Urso. La giornata di Trento, dedicata ai temi del digitale, è stata presieduta dal Sottosegretario di Stato con delega all’innovazione tecnologica, Alessio Butti.",
    ),
  ),
  paragrafo(
    testo("Al termine dei lavori, i membri del G7 hanno adottato la "),
    collegamento(
      "Dichiarazione ministeriale su Industria, Tecnologia e Digitale",
      URL.dichiarazioneTrento,
    ),
    testo(
      ", che ha definito le priorità e gli impegni da sviluppare nel corso della Presidenza italiana.",
    ),
  ),
  titolo(3, "Da Trento a Cernobbio: il lavoro coordinato dal DTD"),
  paragrafo(
    testo(
      "Per gli ambiti digitali di propria competenza, il Dipartimento per la trasformazione digitale ha coordinato il lavoro della Presidenza italiana nel D&TWG lungo quattro direttrici principali:",
    ),
  ),
  elenco(
    "uso sicuro, affidabile e responsabile dell’intelligenza artificiale nel settore pubblico;",
    "lo sviluppo di servizi pubblici digitali accessibili e incentrati sulle persone;",
    "il confronto tra i diversi approcci nazionali all’identità digitale;",
    "l’attuazione dei risultati del Processo di Hiroshima sull’intelligenza artificiale.",
  ),
  paragrafo(
    testo(
      "Il percorso si è concluso il 15 ottobre 2024 con la riunione ministeriale su Tecnologia e Digitale di Cernobbio, presieduta dal Sottosegretario Alessio Butti. In tale occasione, i membri del G7 hanno adottato un ",
    ),
    collegamento("comunicato congiunto", URL.comunicatoCernobbio),
    testo(" e riconosciuto i risultati raggiunti durante l’anno."),
  ),
  titolo(3, "I principali risultati"),
  blocco(
    elencoNumerato([
      {
        titolo: "Intelligenza artificiale nel settore pubblico",
        testo: `La Presidenza italiana ha promosso la realizzazione del [G7 Toolkit for Artificial Intelligence in the Public Sector](${URL.toolkitIa}), elaborato con il supporto dell’OCSE e dell’UNESCO.\n\nIl Toolkit aiuta responsabili pubblici e decisori politici a tradurre i principi per un’intelligenza artificiale sicura e affidabile in indicazioni operative. Raccoglie modelli di governance, condizioni abilitanti, buone pratiche e casi d’uso sviluppati dalle amministrazioni pubbliche dei Paesi G7.`,
      },
      {
        titolo: "Governo e servizi pubblici digitali",
        testo: `Il [G7 Compendium of Digital Government Services](${URL.compendioServizi}), predisposto con il supporto dell’OCSE, raccoglie esperienze e soluzioni adottate dai Paesi G7 per migliorare l’accessibilità, la qualità e l’esperienza d’uso dei servizi pubblici digitali.\n\nIl documento approfondisce anche il ruolo delle infrastrutture pubbliche digitali e offre una base comune per proseguire la cooperazione su servizi più semplici, inclusivi, affidabili e incentrati sulle esigenze delle persone.`,
      },
      {
        titolo: "Identità digitale",
        testo: `Il [G7 Mapping Exercise of Digital Identity Approaches](${URL.mappaturaIdentita}) mette a confronto gli approcci all’identità digitale adottati dai membri del G7.\n\nL’analisi individua elementi comuni nelle definizioni, negli standard tecnici e nei livelli di garanzia utilizzati dai diversi Paesi. Il lavoro rappresenta un punto di partenza per rafforzare la cooperazione internazionale e sostenere, nel tempo, una maggiore interoperabilità tra i sistemi.`,
      },
      {
        titolo:
          "Attuazione del Processo di Hiroshima sull’intelligenza artificiale",
        testo: `Il Hiroshima Artificial Intelligence Process (HAIP) è un’iniziativa avviata dal G7 sotto la Presidenza giapponese del 2023 per promuovere lo sviluppo e l’uso sicuro, responsabile e affidabile dei sistemi avanzati di intelligenza artificiale. Comprende principi internazionali e un Codice di condotta volontario rivolto alle organizzazioni che sviluppano tali sistemi.\n\nDurante la Presidenza italiana del 2024, il G7 ha trasformato questi principi in uno strumento operativo. Con il supporto dell’OCSE, l’Italia ha contribuito a sviluppare e sperimentare l’[Hiroshima AI Process Reporting Framework](${URL.haipOverview}), attraverso il quale le organizzazioni possono presentare in modo strutturato e confrontabile le proprie pratiche di governance e gestione dei rischi. La fase pilota ha coinvolto 20 organizzazioni di dieci Paesi. Questa fase si è conclusa a febbraio 2025 con il lancio della [piattaforma](${URL.haipOverview}) e la realizzazione del primo ciclo di rendicontazione. Sotto la Presidenza italiana è stato realizzato anche il "[brand](${URL.haipBrand})" dello HAIP Reporting Framework.\n\nIl progetto è proseguito sotto la Presidenza canadese del 2025. Nel 2026, sotto la Presidenza francese, l’OCSE ha pubblicato una [versione 2.0 semplificata e ampliata](${URL.haipVersione2}), più accessibile anche alle piccole e medie imprese.\n\nLa prosecuzione e il progressivo aggiornamento dell’iniziativa confermano la continuità del lavoro svolto durante la Presidenza italiana del 2024. Ripreso e sviluppato dalle Presidenze successive, il Reporting Framework è oggi uno strumento internazionale operativo e in evoluzione, volto a rafforzare la trasparenza, la responsabilità e la fiducia nell’intelligenza artificiale.`,
      },
      {
        titolo: "Un contributo destinato a proseguire",
        testo:
          "I risultati della Presidenza italiana hanno trasformato gli impegni condivisi a Trento in strumenti concreti a disposizione dei governi e della comunità internazionale.\n\nIl Toolkit sull’intelligenza artificiale, il Compendio sui servizi pubblici digitali, la Mappatura degli approcci all’identità digitale e il Reporting Framework del Processo di Hiroshima costituiscono una base per proseguire la cooperazione del G7 su un’innovazione responsabile, inclusiva e orientata alle persone.",
      },
    ]),
  ),
  blocco(
    collegamentiUtili([
      {
        etichetta:
          "Dichiarazione ministeriale G7 su Industria, Tecnologia e Digitale — Verona e Trento, 14-15 marzo 2024",
        url: URL.dichiarazioneTrento,
      },
      {
        etichetta:
          "Comunicato congiunto G7 su Tecnologia e Digitale — Cernobbio, 15 ottobre 2024",
        url: URL.comunicatoCernobbio,
      },
      {
        etichetta:
          "G7 Toolkit for Artificial Intelligence in the Public Sector",
        url: URL.toolkitIa,
      },
      {
        etichetta: "G7 Compendium of Digital Government Services",
        url: URL.compendioServizi,
      },
      {
        etichetta: "G7 Mapping Exercise of Digital Identity Approaches",
        url: URL.mappaturaIdentita,
      },
      {
        etichetta:
          "Sintesi della fase pilota del Reporting Framework del Processo di Hiroshima",
        url: URL.sintesiPilota,
      },
    ]),
  ),
];

const g20 = [
  titolo(3, "Il contributo del DTD ai lavori del G20"),
  paragrafo(
    testo(
      "Il G20 è il principale foro di cooperazione economica internazionale. Nel percorso dedicato all’economia digitale, il Dipartimento partecipa al confronto sulle politiche per una trasformazione digitale inclusiva, sicura e sostenibile, insieme alle altre amministrazioni italiane competenti.",
    ),
  ),
  titolo(3, "Il G20 e l’economia digitale"),
  paragrafo(
    testo(
      "Il G20 è un foro informale che riunisce 19 Paesi — Argentina, Australia, Brasile, Canada, Cina, Francia, Germania, India, Indonesia, Italia, Giappone, Messico, Repubblica di Corea, Federazione Russa, Arabia Saudita, Sudafrica, Türkiye, Regno Unito e Stati Uniti — oltre all’Unione europea e all’Unione africana. Nel complesso, i suoi membri rappresentano circa l’80% del PIL mondiale, il 75% delle esportazioni globali e il 60% della popolazione mondiale.",
    ),
  ),
  paragrafo(
    testo(
      "La Presidenza del G20 viene assunta a rotazione annuale da uno dei Paesi membri, che definisce le priorità e coordina i lavori fino al Vertice dei leader.",
    ),
  ),
  paragrafo(
    testo(
      "Nel percorso dedicato all’economia digitale, i ministri competenti si confrontano sulle opportunità e sulle sfide poste dalla trasformazione digitale. I lavori sono preparati dal Digital Economy Working Group (DEWG) e riguardano, tra gli altri:",
    ),
  ),
  elenco(
    "la connettività e la riduzione dei divari digitali;",
    "le tecnologie emergenti, compresa l’intelligenza artificiale;",
    "la circolazione, l’accesso e la governance dei dati;",
    "le competenze digitali;",
    "i servizi pubblici, l’identità e le infrastrutture digitali;",
    "la sicurezza e la fiducia nell’ambiente digitale.",
  ),
  titolo(3, "La prima Presidenza italiana del G20"),
  paragrafo(
    testo(
      "Nel 2021, l’Italia ha assunto per la prima volta la Presidenza del G20, ponendo l’economia digitale e il governo digitale tra le priorità del percorso dedicato alla digitalizzazione. Per i temi di competenza del Dipartimento, i lavori si sono concentrati sulla continuità dei servizi pubblici, sull’identità digitale e su approcci normativi capaci di accompagnare l’innovazione.",
    ),
  ),
  paragrafo(testo("Con il supporto dell’OCSE sono stati realizzati:")),
  elenco(
    [
      collegamento(
        "G20 Compendium on the Use of Digital Tools for Public Service Continuity",
        URL.g20Compendio,
      ),
      testo(";"),
    ],
    [
      collegamento(
        "G20 Collection of Digital Identity Practices",
        URL.g20Identita,
      ),
      testo(";"),
    ],
    [
      collegamento(
        "G20 Survey on Agile Approaches to the Regulatory Governance of Innovation",
        URL.g20Survey,
      ),
      testo("."),
    ],
  ),
  paragrafo(
    testo(
      "Nel corso della Presidenza italiana, la Digital Economy Task Force è stata trasformata nel Digital Economy Working Group (DEWG), consolidando il confronto sulla trasformazione digitale come componente stabile dell’agenda del G20.",
    ),
  ),
];

const ue = [
  titolo(3, "Il contributo del DTD"),
  paragrafo(
    testo(
      "Il Dipartimento per la trasformazione digitale partecipa alla definizione e all’attuazione delle politiche europee in materia di trasformazione digitale, contribuendo ai lavori delle istituzioni dell’Unione europea e promuovendo l’allineamento delle politiche nazionali agli obiettivi del Decennio digitale europeo 2030.",
    ),
  ),
  paragrafo(
    testo(
      "Il quadro europeo si è progressivamente evoluto: accanto allo sviluppo del mercato unico digitale, assumono oggi un ruolo centrale la competitività e la sovranità tecnologica dell’Europa, la diffusione di infrastrutture digitali avanzate, l’intelligenza artificiale, la sicurezza e la resilienza delle reti e dei sistemi, l’interoperabilità dei servizi e lo sviluppo delle competenze digitali.",
    ),
  ),
  paragrafo(
    testo(
      "In questo contesto, il Dipartimento contribuisce alle iniziative europee attraverso la partecipazione ai processi decisionali e ai gruppi di lavoro dell’Unione europea, nonché attraverso programmi e progetti che rafforzano la dimensione europea della trasformazione digitale italiana.",
    ),
  ),
  paragrafo(testo("Tra le principali aree di intervento rientrano:")),
  elenco(
    "identità e portafoglio digitale europeo;",
    "connettività e infrastrutture digitali;",
    "cloud ed edge cloud;",
    "innovazione e tecnologie emergenti;",
    "attuazione del Decennio digitale 2030.",
  ),
  paragrafo(
    testo(
      "L’azione del Dipartimento si colloca quindi all’interno di un percorso europeo che punta a coniugare innovazione, competitività, sicurezza, interoperabilità e tutela dei diritti, rafforzando al tempo stesso la capacità dell’Europa di sviluppare e utilizzare tecnologie digitali strategiche.",
    ),
  ),
  titolo(3, "Il Programma strategico per il decennio digitale 2030"),
  paragrafo(
    testo(
      "Il Programma strategico per il decennio digitale 2030 (Digital Decade Policy Programme – DDPP), istituito con la Decisione (UE) 2022/2481, definisce il quadro comune con cui l’Unione europea e gli Stati membri perseguono e monitorano gli obiettivi digitali al 2030. Gli obiettivi riguardano quattro ambiti: competenze digitali, infrastrutture digitali sicure e sostenibili, trasformazione digitale delle imprese e digitalizzazione dei servizi pubblici.",
    ),
  ),
  titolo(3, "La tabella di marcia strategica nazionale"),
  paragrafo(
    testo(
      "Il Programma prevede che ogni Stato membro adotti una tabella di marcia strategica nazionale (National Roadmap). È il documento programmatico in cui il Paese indica il proprio contributo al raggiungimento degli obiettivi europei. Ne fanno parte:",
    ),
  ),
  elenco(
    "le traiettorie nazionali attese per ciascun obiettivo;",
    "le politiche, le misure e gli investimenti, già adottati o programmati, per conseguirle;",
    "le risorse destinate alla loro attuazione.",
  ),
  paragrafo(
    testo(
      "La tabella di marcia viene adeguata periodicamente per tenere conto dei progressi compiuti. Tiene conto, inoltre, delle raccomandazioni che la Commissione europea rivolge a ciascuno Stato membro nella Relazione annuale sullo stato del decennio digitale.",
    ),
  ),
  titolo(3, "Il ruolo del Dipartimento per la trasformazione digitale"),
  paragrafo(
    testo(
      "In Italia il coordinamento nazionale del Programma è affidato al Dipartimento per la trasformazione digitale. In questa veste il Dipartimento:",
    ),
  ),
  elenco(
    "coordina la definizione e l’aggiornamento della tabella di marcia nazionale, in raccordo con le amministrazioni competenti per i diversi ambiti, e ne assicura la coerenza con gli obiettivi europei;",
    "rappresenta l’Italia nel Digital Decade Board e cura l’interlocuzione con la Commissione europea sull’attuazione del Programma, anche nei confronti bilaterali sulle raccomandazioni rivolte al Paese;",
    "monitora i progressi nazionali verso gli obiettivi 2030;",
    "segue la revisione dei principali strumenti di rilevazione che alimentano il quadro di monitoraggio europeo.",
  ),
  paragrafo(
    testo(
      "Tra questi strumenti rientra l’eGovernment Benchmark. Si tratta della rilevazione annuale che valuta la disponibilità e la funzionalità dei servizi pubblici digitali per cittadini e imprese, e contribuisce alla misurazione dei relativi indicatori del Programma. Il Dipartimento partecipa alla revisione dei dati e delle evidenze riferiti all’Italia, affinché i risultati restituiscano un quadro accurato dell’evoluzione dei servizi pubblici digitali nazionali.",
    ),
  ),
  titolo(
    3,
    "Il Consiglio Trasporti, Telecomunicazioni, Energia – parte Telecomunicazioni",
  ),
  paragrafo(
    testo(
      "Il Dipartimento partecipa ai lavori del Consiglio Trasporti, Telecomunicazioni, Energia (TTE) – parte Telecomunicazioni, che riunisce i ministri degli Stati membri responsabili delle politiche digitali e delle comunicazioni elettroniche.",
    ),
  ),
  paragrafo(
    testo(
      "Il Consiglio, insieme al Parlamento europeo, contribuisce all’adozione della normativa europea e alla definizione degli orientamenti dell’Unione in materia digitale e di comunicazioni elettroniche, con l’obiettivo di rafforzare il mercato unico, la competitività, l’innovazione, l’interoperabilità e la resilienza delle infrastrutture digitali.",
    ),
  ),
  paragrafo(
    testo(
      "Negli ultimi anni, l’agenda del TTE si è progressivamente ampliata, accompagnando l’evoluzione delle tecnologie e delle priorità strategiche dell’Unione. Accanto all’attuazione dei principali atti che hanno definito il quadro del mercato digitale europeo – tra cui il Digital Services Act (DSA), il Digital Markets Act (DMA), il Data Governance Act e il nuovo quadro europeo per l’identità digitale – il Consiglio è oggi impegnato su dossier riguardanti l’intelligenza artificiale, la cibersicurezza, le infrastrutture digitali e la competitività tecnologica dell’Europa.",
    ),
  ),
  paragrafo(
    testo(
      "Tra i temi di più recente discussione rientrano, in particolare, l’attuazione dell’AI Act, la semplificazione del quadro normativo digitale (Digital Omnibus), il potenziamento dell’ecosistema, degli investimenti e delle infrastrutture dell’UE in materia di cloud e IA (CADA), l’evoluzione del quadro europeo di cibersicurezza (Cybersecurity Act 2), lo sviluppo di reti digitali avanzate (Digital Networks Act) e il nuovo Portafoglio europeo delle imprese (European Business Wallet).",
    ),
  ),
  paragrafo(
    testo(
      "Particolare attenzione è inoltre dedicata alla competitività europea nel Decennio digitale. Nelle conclusioni adottate nel dicembre 2025, il Consiglio ha individuato tra le priorità il rafforzamento della competitività attraverso il digitale, la promozione dell’innovazione e dell’adozione delle tecnologie, la semplificazione del quadro normativo e il rafforzamento della sovranità digitale europea, in un approccio aperto e basato sul rischio.",
    ),
  ),
  paragrafo(
    testo(
      "Il Dipartimento contribuisce a questo percorso portando nei lavori europei l’esperienza italiana e, al tempo stesso, traducendo nel contesto nazionale gli indirizzi e gli obiettivi condivisi a livello dell’Unione.",
    ),
  ),
  blocco(
    notaDaTenereAMente(
      "Da tenere a mente",
      `- Link press release COM [${URL.consiglioTte}](${URL.consiglioTte})`,
    ),
  ),
];

const igf = [
  titolo(3, "Introduzione"),
  paragrafo(
    testo(
      "Il Comitato IGF Italia, istituito presso il Dipartimento per la trasformazione digitale della Presidenza del Consiglio dei ministri, promuove e sostiene la collaborazione per la creazione di uno spazio di dibattito per la governance di Internet secondo un approccio multistakeholder aperto, trasparente e inclusivo, coerentemente con i principi dell’IGF Globale. Il Comitato è composto dai rappresentanti scelti dalle pubbliche amministrazioni, dalle imprese, dalla società civile e dalla comunità scientifica dell’università e della ricerca.",
    ),
  ),
  titolo(4, "Ruolo del Comitato"),
  elenco(
    "Definisce linee guida strategiche relative all’uso e allo sviluppo di Internet in Italia tenendo conto dei risultati del dibattito IGF Italia e delle direttive internazionali (GDC, IGF, ICANN, ecc.);",
    "Coopera e interagisce con le altre amministrazioni che hanno il compito di vigilare sulla tutela del dominio “.it” che rappresenta l’identità dell’Italia su Internet, incoraggiando l’adozione di misure che tengano conto delle migliori best practice internazionali;",
    "Propone programmi di ricerca e sviluppo relativi ad Internet, che consentano il mantenimento del livello di qualità tecnica e di innovazione nell’uso di Internet, nonché favorirne la diffusione su tutto il territorio nazionale;",
    "Promuove studi e raccomanda procedure, norme e standard tecnici e operativi per la sicurezza delle reti e dei servizi Internet;",
    "Promuove sensibilità e dibattito attorno ad iniziative legislative che possano avere un impatto sul funzionamento di Internet;",
    "Partecipa nei forum tecnici nazionali e internazionali relativi a Internet;",
    "Promuove l’organizzazione di convegni, seminari, incontri di studio per approfondire le tematiche della governance di Internet al fine di individuare e proporre al Presidente del Consiglio, o al Ministro delegato per l’innovazione tecnologica e la digitalizzazione, ipotesi di interventi, eventualmente anche normativi;",
    "Favorisce gli incontri e la collaborazione tra coloro che operano nel campo della governance di Internet anche a livello internazionale, stimolando e approfondendo la discussione e la conoscenza delle tematiche legate ad Internet e al suo utilizzo;",
    "Favorisce e promuove l’alfabetizzazione digitale e la conoscenza di Internet a tutti i livelli, facilitando la partecipazione dei giovani;",
    "Collabora e favorisce il coordinamento con gli omologhi IGF europei e internazionali, nonché con gli altri organismi internazionali operanti nel settore della governance di Internet, favorendo e promuovendo la partecipazione multistakeholder italiana nonché la formazione di una posizione nazionale da rappresentare in tali sedi (fra cui, a titolo di esempio, UN-GDC, ICANN, HRLIG della Commissione Europea, EuroDIG, G20 Digital Economy Working Group, G7 Digital & Technology Working Group, Consiglio d’Europa);",
    "Organizza un forum annuale di dibattito delle politiche di sviluppo di Internet e delle relative tecnologie digitali, seguendo le raccomandazioni internazionali di IGF;",
    "Per l’attuazione delle proprie attività il Comitato può avvalersi di soggetti istituzionali ed unità operative che già svolgono queste funzioni e può chiederne l’attivazione di nuovi.",
    "Qualsiasi documento elaborato dal Comitato nell’esecuzione del mandato è soggetto alle licenze Creative Commons e, pertanto, non può essere avanzata alcuna rivendicazione individuale per diritto d’autore o diritti connessi.",
  ),
  titolo(3, "Attività svolte"),
  paragrafo(
    testo(
      "Il Comitato IGF Italia sta organizzando l’edizione 2026 dell’IGF Italia che si svolgerà a Napoli il 29 e 30 ottobre. Il programma delle sessioni è stato definito attraverso un percorso partecipativo che ha coinvolto la comunità italiana dell’Internet governance e ha raccolto oltre 300 contributi provenienti da istituzioni, imprese, università, ricerca, comunità tecnica, società civile e cittadini.",
    ),
  ),
  paragrafo(
    testo(
      "Le 19 sessioni in programma offriranno un’occasione di confronto sui temi più rilevanti per il futuro digitale del Paese, tra cui l’intelligenza artificiale, la sicurezza, l’innovazione, i diritti online, le competenze digitali e l’evoluzione di Internet.",
    ),
  ),
  paragrafo(
    testo(
      "L’evento sarà un momento di ascolto e dialogo, utile a mettere in comune idee, esperienze e proposte per rendere la rete più sicura, accessibile, affidabile e capace di creare opportunità per tutti.",
    ),
  ),
  blocco(
    collegamentiUtili([
      { etichetta: "DPCM 12 ottobre 2023", url: URL.dpcmIgf },
      { etichetta: "IGF Italia 2026", url: URL.igf2026 },
      {
        etichetta:
          "AgID, “IGF Italia 2026: definito il programma delle sessioni”",
        url: URL.agidIgf,
      },
    ]),
  ),
];

const PAGINE = [
  { titolo: "G7", slug: "g7", contenuto: g7 },
  { titolo: "G20", slug: "g20", contenuto: g20 },
  { titolo: "UE", slug: "ue", contenuto: ue },
  { titolo: "IGF Italia", slug: "igf-italia", contenuto: igf },
];

const tipi = await client.itemTypes.list();
const article = tipi.find((t) => t.api_key === "article");

for (const pagina of PAGINE) {
  const esistenti = await client.items.list({
    filter: { type: article.id, fields: { slug: { eq: pagina.slug } } },
  });
  const dati = {
    title: { it: pagina.titolo },
    slug: { it: pagina.slug },
    parent_page: { it: PAGINA_PADRE },
    article_type: "focus",
    show_sidebar: true,
    content: {
      it: {
        schema: "dast",
        document: { type: "root", children: pagina.contenuto },
      },
    },
  };

  const record = esistenti.length
    ? await client.items.update(esistenti[0].id, dati)
    : await client.items.create({
        item_type: { type: "item_type", id: article.id },
        ...dati,
      });
  await client.items.publish(record.id);
  console.log(
    `${esistenti.length ? "Aggiornata" : "Creata"} ${pagina.titolo} → ${record.id}`,
  );
}
