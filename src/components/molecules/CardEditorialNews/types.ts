import type { ImageProps } from "@components/atoms/Image/types";
import type { AnnouncementStatusProps } from "@utils/announcementCategory";

export type CardEditorialNewsProps = {
  id?: string;
  title: string;
  description: string;
  image?: ImageProps;
  linkTo: string;
  category?: string | string[];
  categoryLinks?: Record<string, string>;
  filterCategories?: string[];
  badge?: string;
  dateTime?: string;
  sortDate?: string;
  deadline?: string;
  status?: AnnouncementStatusProps;
  action?: string;
  fullHeight?: boolean;
  imageFit?: "cover" | "contain";
  duration?: string | null;
  isExternal?: boolean;
};
