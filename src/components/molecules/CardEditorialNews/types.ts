import type { ImageProps } from "@components/atoms/Image/types";

export type CardEditorialNewsProps = {
  id?: string;
  title: string;
  description: string;
  image?: ImageProps;
  linkTo: string;
  category?: string | string[];
  categoryLinks?: Record<string, string>;
  filterCategories?: string[];
  dateTime?: string;
  action?: string;
  fullHeight?: boolean;
  imageFit?: "cover" | "contain";
  duration?: string | null;
  isExternal?: boolean;
};
