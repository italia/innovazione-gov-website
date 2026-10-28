import rawLinkMap from "@data/linkMap.json";
import type { SiteLocale } from "@graphql/types";
import type { SiteMap } from "@utils/linkResolver";

const linkMap = rawLinkMap as SiteMap;

const TOPIC_SEGMENT = "argomenti";

export type TopicIndex = {
  id: string;
  path: string;
};

export function findTopicIndex(locale: SiteLocale): TopicIndex | null {
  for (const [id, perLocale] of Object.entries(linkMap)) {
    const path = perLocale[locale]?.path;
    if (path && path.endsWith(`/${TOPIC_SEGMENT}`)) return { id, path };
  }
  return null;
}

export function topicPath(locale: SiteLocale, slug: string): string {
  const index = findTopicIndex(locale);
  return index ? `${index.path}/${slug}` : "#";
}

export function topicLinks(
  tags: { name?: string | null; slug?: string | null }[] | null | undefined,
  locale: SiteLocale,
): Record<string, string> {
  const links: Record<string, string> = {};
  for (const tag of tags ?? []) {
    if (!tag.name || !tag.slug) continue;
    const path = topicPath(locale, tag.slug);
    if (path === "#") continue;
    links[tag.name] = path;
  }
  return links;
}
