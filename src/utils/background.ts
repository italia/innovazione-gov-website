export type SectionBackground =
  "default" | "primary" | "dark" | "lighter" | "primary-light";
export type SectionBackgroundHero =
  "default" | "primary" | "lighter" | "dark" | "primary-light";

const BACKGROUND_COLOR_MAP: Record<SectionBackground, string> = {
  default: "it-section-bg-default dark",
  primary: "it-section-bg-primary",
  dark: "it-section-bg-dark",
  lighter: "it-section-bg-light dark",
  "primary-light": "it-section-bg-medium",
};

const BACKGROUND_HERO_COLOR_MAP: Record<SectionBackgroundHero, string> = {
  default: "it-section-bg-default dark",
  primary: "it-section-bg-primary",
  dark: "it-section-bg-dark",
  lighter: "it-section-bg-light dark",
  "primary-light": "it-section-bg-medium",
};

const SECTION_BACKGROUNDS: readonly SectionBackground[] = [
  "default",
  "primary",
  "dark",
  "lighter",
  "primary-light",
];

const isSectionBackground = (value: unknown): value is SectionBackground =>
  SECTION_BACKGROUNDS.some((background) => background === value);

export const toSectionBackground = (value: unknown): SectionBackground =>
  isSectionBackground(value) ? value : "default";

export const getSectionBgClass = (
  bg: SectionBackground = "default",
): string => {
  return BACKGROUND_COLOR_MAP[bg];
};

export const getHeroBgClass = (
  bg: SectionBackgroundHero = "default",
): string => {
  return BACKGROUND_HERO_COLOR_MAP[bg];
};
