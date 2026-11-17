import type { SiteLocale } from "@graphql/types";
import { getI18n } from "@i18n/microcopy";

export const ANNOUNCEMENT_TAB_TYPE = "announcement";

export type AnnouncementStatusProps = {
  label: string;
  open: boolean;
};

export function announcementCategoryLabel(
  category: string | null | undefined,
  lang: SiteLocale,
): string {
  if (!category) return "";
  const t = getI18n(lang);
  return t[`announcement.kind.${category}`] ?? "";
}

export function announcementSectionLabel(lang: SiteLocale): string {
  return getI18n(lang)["announcement.section"];
}

export function effectiveAnnouncementStatus(
  status: string,
  closeDate?: string | null,
): string {
  if (status !== "open") return status;
  const oggi = new Date().toISOString().slice(0, 10);
  return closeDate && closeDate < oggi ? "expired" : "open";
}

export function announcementStatus(
  status: string,
  closeDate: string | null | undefined,
  lang: SiteLocale,
): AnnouncementStatusProps {
  const effettivo = effectiveAnnouncementStatus(status, closeDate);
  const t = getI18n(lang);
  return {
    label: t[`announcement.status.${effettivo}`] ?? "",
    open: effettivo === "open",
  };
}

export function announcementDeadline(
  status: string,
  closeDate: string | null | undefined,
  showDateAfterClosed: boolean | null | undefined,
): string | undefined {
  if (!closeDate) return undefined;
  const aperto = effectiveAnnouncementStatus(status, closeDate) === "open";
  return aperto || showDateAfterClosed ? closeDate : undefined;
}
