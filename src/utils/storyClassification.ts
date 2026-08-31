export const ARTICLE_TYPE_LABELS: Record<string, string> = {
  news: "Notizia",
  press_release: "Comunicato stampa",
  interview: "Intervista",
  participation: "Intervento",
  focus: "Focus",
  guida: "Guida",
};

export function articleTypeLabel(type?: string | null): string {
  if (!type) return "";
  return ARTICLE_TYPE_LABELS[type] ?? type;
}

const ARTICLE_TYPE_BY_TAB_TYPE: Record<string, string> = {
  article: "news",
  news: "news",
  interview: "interview",
  participation: "participation",
  press_release: "press_release",
  focus_page: "focus",
  guida: "guida",
};

export function articleTypeForTabType(tabType?: string | null): string | null {
  if (!tabType) return null;
  return ARTICLE_TYPE_BY_TAB_TYPE[tabType] ?? null;
}

const UNDERSECRETARY_OWNER_LABEL = "sottosegretario";

export function isUndersecretaryOwner(label?: string | null): boolean {
  return label?.trim().toLowerCase() === UNDERSECRETARY_OWNER_LABEL;
}
