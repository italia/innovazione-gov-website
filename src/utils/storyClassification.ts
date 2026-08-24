export const NEWS_STORY_CLASS_ID = "GMc8iddaTTiyE0LjZHKZ8Q";
export const PLATFORMS_STORY_CLASS_ID = "I_yJs25GSZ-PG4kU1EbeqA";

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

export function isNewsStoryClass(storyClassId?: string | null): boolean {
  return storyClassId === NEWS_STORY_CLASS_ID;
}

export function articleTypeForStoryClass(
  storyClassId?: string | null,
): string | null {
  if (storyClassId === NEWS_STORY_CLASS_ID) return "news";
  return null;
}

const ARTICLE_TYPE_BY_CLASS_LABEL: Record<string, string> = {
  notizie: "news",
  "comunicati stampa": "press_release",
  interviste: "interview",
  interventi: "participation",
  focus: "focus",
  guide: "guida",
  guida: "guida",
};

const UNDERSECRETARY_OWNER_LABEL = "sottosegretario";

export function isUndersecretaryOwner(label?: string | null): boolean {
  return label?.trim().toLowerCase() === UNDERSECRETARY_OWNER_LABEL;
}

export function articleTypeForClassLabel(label?: string | null): string | null {
  if (!label) return null;
  return ARTICLE_TYPE_BY_CLASS_LABEL[label.trim().toLowerCase()] ?? null;
}
