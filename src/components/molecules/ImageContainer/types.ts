import type { ImageProps } from "@components/atoms/Image/types";

export type RatioImageProps = "4x3" | "1x1" | "16x9" | "21x9" | "natural";

export type ImageContainerProps = {
  ratio?: RatioImageProps;
  image: ImageProps;
};
