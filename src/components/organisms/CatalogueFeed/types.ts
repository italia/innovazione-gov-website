import type { SectionBackground } from "@utils/background";

export type PageNewsTab = {
  title: string;
  paragraph: string;
  filterTitle: string;
  labelForAll: string;
  filterStory?: string;
  filterOwner?: string;
  newsPageTabType: string;
  filterStyle?: string[];
  perPage?: number;
  sortMode?: string;
};

export type UpdateTabSectionProps = {
  id: string;
  background?: SectionBackground;
  tabs: PageNewsTab[];
};

export type ElementType =
  | "news_item"
  | "story_item"
  | "webinar_item"
  | "resource"
  | "measures"
  | "interview";
