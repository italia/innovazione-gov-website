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
import { articleTypeLabel } from "@utils/storyClassification";
import { removeLang } from "@utils/pathHelper";
import rawLinkMap from "@data/linkMap.json";
import type { SiteMap } from "@utils/linkResolver";
import { findTopicIndex, topicPath } from "@utils/topicRoutes";
import { getCollection } from "astro:content";

const SEZIONI = [
  {
    articleTypes: ["project"],
    titolo: "Progetti",
    sottotitolo: "I progetti del Dipartimento che riguardano questo argomento",
    indice: "attivita",
    etichettaCta: "Vedi tutti i progetti",
    sfondo: "lighter" as const,
    aCard: true,
    conBadge: false,
    quanti: 4,
  },
  {
    articleTypes: ["focus"],
    titolo: "Focus",
    sottotitolo: "Approfondimenti e aggiornamenti su questo argomento",
    indice: "novita/focus",
    etichettaCta: "Vedi tutti i focus",
    sfondo: "lighter" as const,
    aCard: true,
    conBadge: false,
    quanti: 4,
  },
  {
    articleTypes: ["news", "press_release", "interview", "participation"],
    titolo: "Contenuti editoriali",
    sottotitolo:
      "Notizie, comunicati stampa, interviste e interventi su questo argomento",
    indice: null,
    etichettaCta: null,
    sfondo: "default" as const,
    aCard: false,
    conBadge: true,
    quanti: 6,
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
        const suoi = articoli
          .filter((voce) => {
            const articolo = voce.data;
            if (!sezione.articleTypes.includes(articolo.articleType ?? ""))
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
            immagine:
              getLocaleValue(voce.data.allLogoLocales, lingua, null) ??
              getLocaleValue(voce.data.allImageLocales, lingua, null),
            path: linkResolver(voce.data.id, lingua),
          }))
          .sort((a, b) =>
            String(b.dateShown).localeCompare(String(a.dateShown)),
          );

        return {
          titolo: sezione.titolo,
          sottotitolo: sezione.sottotitolo,
          aCard: sezione.aCard,
          conBadge: sezione.conBadge,
          percorsoIndice: sezione.indice
            ? percorsoEsistente(`/${lingua}/${sezione.indice}`)
            : null,
          etichettaCta: sezione.etichettaCta,
          sfondo: sezione.sfondo,
          totale: suoi.length,
          articoli: suoi.slice(0, sezione.quanti),
        };
      }).filter((sezione) => sezione.totale > 0);

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
