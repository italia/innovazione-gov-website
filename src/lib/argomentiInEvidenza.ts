import type { SiteLocale } from "@graphql/types";
import { topicPath } from "@utils/topicRoutes";
import { getCollection } from "astro:content";

const TIPI_IN_ELENCO = ["news", "focus", "press_release"];

export type ArgomentoInEvidenza = {
  name: string;
  path: string;
  count: number;
};

export async function getArgomentiInEvidenza(
  locale: SiteLocale,
  quanti = 0,
): Promise<ArgomentoInEvidenza[]> {
  const articoli = await getCollection("article");
  const perSlug = new Map<string, { name: string; count: number }>();

  for (const voce of articoli) {
    const articolo = voce.data;
    if (!TIPI_IN_ELENCO.includes(articolo.articleType ?? "")) continue;
    if (!articolo.locales.includes(locale)) continue;
    for (const tag of articolo.tags ?? []) {
      if (!tag.slug || !tag.name || !tag.isCategory) continue;
      const attuale = perSlug.get(tag.slug);
      perSlug.set(tag.slug, {
        name: tag.name,
        count: (attuale?.count ?? 0) + 1,
      });
    }
  }

  const ordinati = [...perSlug]
    .map(([slug, dati]) => ({
      name: dati.name,
      count: dati.count,
      path: topicPath(locale, slug),
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "it"));

  return quanti > 0 ? ordinati.slice(0, quanti) : ordinati;
}
