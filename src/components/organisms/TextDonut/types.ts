import type { SectionBackground } from "@utils/background";

export type TextDonutProps = {
  label?: string;
  percentage: number;
  description?: string;
  background?: SectionBackground;
  sectionTitleId?: string;
  altText?: string;
};
