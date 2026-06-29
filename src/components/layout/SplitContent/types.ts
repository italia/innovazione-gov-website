import type { SectionBackground } from "@utils/background";

export type SectionAlignItems = "top" | "center" | "stretch";

export type SplitContentProps = {
  leftColumns?: number;
  rightColumns?: number;
  alignItems?: SectionAlignItems;
  background?: SectionBackground;
  classSecondColumn?: string;
  sectionTitleId?: string;
};
