import {
  AltImageFragment,
  TagFragment,
} from "@graphql/fragment/commonFragments";
import { graphql } from "@graphql/graphql";
import type { SiteLocale } from "@graphql/types";
import { executeQuery } from "@lib/datocms";
import { DatoBlockModel } from "@utils/cmsMapper";
import { getLocaleValue } from "@utils/getLocaleValue";
import { linkResolver } from "@utils/linkResolver";
import { articleTypeLabel, showsImageInCard } from "@utils/storyClassification";
import { removeLang } from "@utils/pathHelper";
import rawLinkMap from "@data/linkMap.json";
import type { SiteMap } from "@utils/linkResolver";
import { findTopicIndex, topicPath } from "@utils/topicRoutes";
import { getCollection } from "astro:content";

/**
 * Struttura della pagina argomento. Segue la gerarchia del sito: Progetti e
 * Attività internazionali sono "cose che facciamo" (Attività, Dipartimento),
 * i Contenuti editoriali raccolgono tutto ciò che sta sotto Novità, Focus
 * compresi: sono contenuti editoriali, solo più in evidenza.
 *
 * Ogni sezione è un H2 con sfondo proprio e contiene uno o più gruppi di
 * articoli. Un gruppo con `titolo` diventa una sottosezione H3; senza titolo
 * i suoi articoli stanno direttamente sotto l'H2.
 */
type GruppoArgomento = {
  articleTypes: string[];
  titolo: string | null;
  indice: string | null;
  etichettaCta: string | null;
  aCard: boolean;
  conBadge: boolean;
  /** Quanti articoli mostrare; null = tutti, senza bottone "vedi tutti". */
  quanti: number | null;
};

type SezioneArgomento = {
  titolo: string;
  sottotitolo: string;
  sfondo: "lighter" | "default";
  gruppi: GruppoArgomento[];
};

const SEZIONI: SezioneArgomento[] = [
  {
    titolo: "Progetti",
    sottotitolo: "I progetti del Dipartimento che riguardano questo argomento",
    sfondo: "lighter",
    gruppi: [
      {
        articleTypes: ["project"],
        titolo: null,
        indice: "attivita",
        etichettaCta: "Vedi tutti i progetti",
        aCard: true,
        conBadge: false,
        quanti: 4,
      },
    ],
  },
  {
    titolo: "Attività internazionali",
    sottotitolo:
      "La partecipazione del Dipartimento ai tavoli internazionali su questo argomento",
    sfondo: "lighter",
    gruppi: [
      {
        articleTypes: ["international"],
        titolo: null,
        indice: null,
        etichettaCta: null,
        aCard: true,
        conBadge: false,
        quanti: 4,
      },
    ],
  },
  {
    titolo: "Contenuti editoriali",
    sottotitolo:
      "Notizie, comunicati stampa, interviste e interventi su questo argomento",
    sfondo: "default",
    gruppi: [
      {
        articleTypes: ["focus"],
        titolo: "Focus",
        indice: null,
        etichettaCta: null,
        aCard: true,
        conBadge: false,
        quanti: null,
      },
      {
        articleTypes: ["news", "press_release", "interview", "participation"],
        titolo: "Novità",
        indice: null,
        etichettaCta: null,
        aCard: false,
        conBadge: true,
        quanti: 6,
      },
    ],
  },
];

const TagsQuery = graphql(
  `
    query TagsPerArgomenti {
      allTags(first: 100) {
        id
        name
        slug
        description
        seoMeta: _seoMetaTags {
          ...TagFragment
        }
        previewImage {
          ...AltImageFragment
        }
      }
    }
  `,
  [TagFragment, AltImageFragment],
);

const TIPI_CON_PAGINA_ARGOMENTO = SEZIONI.flatMap((sezione) =>
  sezione.gruppi.flatMap((gruppo) => gruppo.articleTypes),
);

export async function argomentiConPagina(
  locale: SiteLocale,
): Promise<Set<string>> {
  if (!findTopicIndex(locale)) return new Set();

  const articoli = await getCollection("article");
  const conPagina = new Set<string>();

  for (const voce of articoli) {
    const articolo = voce.data;
    if (!TIPI_CON_PAGINA_ARGOMENTO.includes(articolo.articleType ?? "")) {
      continue;
    }
    if (!articolo.locales.includes(locale)) continue;
    for (const tag of articolo.tags ?? []) {
      if (tag.slug) conPagina.add(tag.slug);
    }
  }

  return conPagina;
}

const percorsiNoti = new Set(
  Object.values(rawLinkMap as SiteMap).flatMap((perLocale) =>
    Object.values(perLocale)
      .map((voce) => voce?.path)
      .filter((path): path is string => Boolean(path)),
  ),
);

const percorsoEsistente = (path: string) =>
  percorsiNoti.has(path) ? path : null;

export async function buildTopicPaths(locales: SiteLocale[]) {
  const { allTags } = await executeQuery(TagsQuery, { includeDrafts: false });
  const articoli = await getCollection("article");
  const indici = await getCollection("catalogue");

  const percorsi = [];

  for (const lingua of locales) {
    const indiceArgomenti = findTopicIndex(lingua);
    if (!indiceArgomenti) continue;

    const voceIndice = indici.find((v) => v.data.id === indiceArgomenti.id);
    const bloccoChiusura = (
      getLocaleValue(voceIndice?.data.allContentLocales, lingua, []) ?? []
    ).find((blocco) => blocco?.componentName === DatoBlockModel.TextImage);

    for (const tag of allTags) {
      if (!tag.slug || !tag.name) continue;

      const sezioni = SEZIONI.map((sezione) => {
        const gruppi = sezione.gruppi
          .map((gruppo) => {
            const suoi = articoli
              .filter((voce) => {
                const articolo = voce.data;
                if (!gruppo.articleTypes.includes(articolo.articleType ?? ""))
                  return false;
                if (!articolo.locales.includes(lingua)) return false;
                return (articolo.tags ?? []).some((t) => t.slug === tag.slug);
              })
              .map((voce) => ({
                id: voce.data.id,
                tipo: articleTypeLabel(voce.data.articleType),
                title: getLocaleValue(voce.data.allTitleLocales, lingua, ""),
                paragraph: getLocaleValue(
                  voce.data.allParagraphLocales,
                  lingua,
                  "",
                ),
                dateShown: voce.data.dateShown ?? voce.data.publishedAt ?? null,
                immagine: showsImageInCard(voce.data.articleType)
                  ? (getLocaleValue(voce.data.allLogoLocales, lingua, null) ??
                    getLocaleValue(voce.data.allImageLocales, lingua, null))
                  : null,
                path: linkResolver(voce.data.id, lingua),
              }))
              .sort((a, b) =>
                String(b.dateShown).localeCompare(String(a.dateShown)),
              );

            return {
              titolo: gruppo.titolo,
              aCard: gruppo.aCard,
              conBadge: gruppo.conBadge,
              percorsoIndice: gruppo.indice
                ? percorsoEsistente(`/${lingua}/${gruppo.indice}`)
                : null,
              etichettaCta: gruppo.etichettaCta,
              totale: suoi.length,
              articoli:
                gruppo.quanti === null ? suoi : suoi.slice(0, gruppo.quanti),
            };
          })
          .filter((gruppo) => gruppo.totale > 0);

        return {
          titolo: sezione.titolo,
          sottotitolo: sezione.sottotitolo,
          sfondo: sezione.sfondo,
          gruppi,
        };
      }).filter((sezione) => sezione.gruppi.length > 0);

      if (!sezioni.length) continue;

      percorsi.push({
        params: {
          lang: lingua,
          topic: removeLang(topicPath(lingua, tag.slug), lingua),
        },
        props: {
          indiceArgomentiId: indiceArgomenti.id,
          slug: tag.slug,
          nome: tag.name,
          descrizione: tag.description ?? null,
          seoMeta: tag.seoMeta ?? [],
          immagineAnteprima: tag.previewImage ?? null,
          sezioni,
          bloccoChiusura: bloccoChiusura ?? null,
        },
      });
    }
  }

  return percorsi;
}
