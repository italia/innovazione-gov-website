import type { SiteLocale } from "@graphql/types";

export const ANNOUNCEMENT_TAB_TYPE = "announcement";

import { getI18n } from "@i18n/microcopy";

export function announcementCategoryLabel(
  category: string | null | undefined,
  lang: SiteLocale,
): string {
  if (!category) return "";
  const t = getI18n(lang);
  return t[`announcement.kind.${category}`] ?? "";
}
