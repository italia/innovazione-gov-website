import type { ImageProps } from "@components/atoms/Image/types";

export type TimelineItemProps = {
  id: string;
  period: string;
  title: string;
  paragraph?: string;
  image?: ImageProps;
  linkLabel?: string;
  linkTo?: string;
  openInNewTab?: boolean;
};

export type TimelineProps = {
  title: string;
  paragraph?: string;
  items: TimelineItemProps[];
};
