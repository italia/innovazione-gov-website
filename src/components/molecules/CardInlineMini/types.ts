import type { ImageProps } from "@components/atoms/Image/types";
import type { AnnouncementStatusProps } from "@utils/announcementCategory";

export type CardInlineMiniProps = {
  id?: string;
  title: string;
  description?: string;
  image?: ImageProps;
  linkTo: string;
  category?: string | string[];
  badge?: string;
  dateTime?: string;
  deadline?: string;
  status?: AnnouncementStatusProps;
  ariaLabelCardCategory?: string;
  isExternal?: boolean;
};
