import type { SiteLocale } from "@graphql/types";
import { argomentiConPagina } from "@lib/topics";
import { topicPath } from "@utils/topicRoutes";
import { getCollection } from "astro:content";

const TIPI_PER_CONTEGGIO = ["news", "focus", "press_release"];

export type ArgomentoInEvidenza = {
  name: string;
  path: string;
  description: string | null;
};

const perNome = (a: ArgomentoInEvidenza, b: ArgomentoInEvidenza) =>
  a.name.localeCompare(b.name, "it");

async function argomentiScelti(
  locale: SiteLocale,
): Promise<ArgomentoInEvidenza[]> {
  const tags = await getCollection("tag");
  const conPagina = await argomentiConPagina(locale);
  const scelti: ArgomentoInEvidenza[] = [];

  for (const voce of tags) {
    const tag = voce.data;
    if (!tag.isHighlighted || !tag.name || !tag.slug) continue;
    if (!conPagina.has(tag.slug)) continue;
    scelti.push({
      name: tag.name,
      path: topicPath(locale, tag.slug),
      description: tag.description ?? null,
    });
  }

  return scelti.sort(perNome);
}

async function argomentiPiuUsati(
  locale: SiteLocale,
  quanti: number,
): Promise<ArgomentoInEvidenza[]> {
  const articoli = await getCollection("article");
  const perSlug = new Map<
    string,
    { name: string; description: string | null; count: number }
  >();

  for (const voce of articoli) {
    const articolo = voce.data;
    if (!TIPI_PER_CONTEGGIO.includes(articolo.articleType ?? "")) continue;
    if (!articolo.locales.includes(locale)) continue;
    for (const tag of articolo.tags ?? []) {
      if (!tag.slug || !tag.name || !tag.isCategory) continue;
      const attuale = perSlug.get(tag.slug);
      perSlug.set(tag.slug, {
        name: tag.name,
        description: tag.description ?? null,
        count: (attuale?.count ?? 0) + 1,
      });
    }
  }

  const ordinati = [...perSlug]
    .sort(
      ([, a], [, b]) => b.count - a.count || a.name.localeCompare(b.name, "it"),
    )
    .map(([slug, dati]) => ({
      name: dati.name,
      description: dati.description,
      path: topicPath(locale, slug),
    }));

  return quanti > 0 ? ordinati.slice(0, quanti) : ordinati;
}

export async function getArgomentiInEvidenza(
  locale: SiteLocale,
  quanti = 0,
): Promise<ArgomentoInEvidenza[]> {
  const scelti = await argomentiScelti(locale);
  if (scelti.length > 0) return scelti;
  return argomentiPiuUsati(locale, quanti);
}
