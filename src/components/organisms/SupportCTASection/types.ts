import type { ImageProps } from "@components/atoms/Image/types";
import type { SectionBackground } from "@utils/background";

export type SupportCTASectionProps = {
  title: string;
  paragraph: string;
  labelButton?: string;
  linkTo?: string;
  image: ImageProps;
  background?: SupportCTASectionBackgroundProps;
  size?: SupportCTASectionSizeProps;
  openInNewTab?: boolean;
};

export type SupportCTASectionBackgroundProps = SectionBackground;
export type SupportCTASectionSizeProps = "default" | "small";
