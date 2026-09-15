import { graphql } from "@graphql/graphql";
import type { SiteLocale } from "@graphql/types";
import { executeQuery } from "@lib/datocms";
import { DatoBlockModel } from "@utils/cmsMapper";
import { getLocaleValue } from "@utils/getLocaleValue";
import { linkResolver } from "@utils/linkResolver";
import { removeLang } from "@utils/pathHelper";
import { findTopicIndex, topicPath } from "@utils/topicRoutes";
import { getCollection } from "astro:content";

const SEZIONI = [
  {
    articleType: "news",
    titolo: "Notizie",
    indice: "notizie",
    etichettaCta: "Vedi tutte le notizie",
  },
  {
    articleType: "focus",
    titolo: "Focus",
    indice: "focus",
    etichettaCta: "Vedi tutti i focus",
  },
  {
    articleType: "press_release",
    titolo: "Comunicati stampa",
    indice: "comunicati-stampa",
    etichettaCta: "Vedi tutti i comunicati stampa",
  },
];

const IN_ELENCO = 4;

const TagsQuery = graphql(`
  query TagsPerArgomenti {
    allTags(first: 100) {
      id
      name
      slug
      description
    }
  }
`);

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
            if (articolo.articleType !== sezione.articleType) return false;
            if (!articolo.locales.includes(lingua)) return false;
            return (articolo.tags ?? []).some((t) => t.slug === tag.slug);
          })
          .map((voce) => ({
            id: voce.data.id,
            title: getLocaleValue(voce.data.allTitleLocales, lingua, ""),
            paragraph: getLocaleValue(
              voce.data.allParagraphLocales,
              lingua,
              "",
            ),
            dateShown: voce.data.dateShown ?? voce.data.publishedAt ?? null,
            path: linkResolver(voce.data.id, lingua),
          }))
          .sort((a, b) =>
            String(b.dateShown).localeCompare(String(a.dateShown)),
          );

        return {
          titolo: sezione.titolo,
          indice: sezione.indice,
          etichettaCta: sezione.etichettaCta,
          totale: suoi.length,
          articoli: suoi.slice(0, IN_ELENCO),
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
          sezioni,
          bloccoChiusura: bloccoChiusura ?? null,
        },
      });
    }
  }

  return percorsi;
}
