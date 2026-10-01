import type { HeroProps } from "./types";

export const hasOnlyBreadcrumb = ({
  title,
  paragraph,
  image,
  imageMobile,
  labelButton,
  linkTo,
  showBreadcrumb,
}: HeroProps): boolean =>
  Boolean(showBreadcrumb) &&
  !title &&
  !paragraph &&
  !(labelButton && linkTo) &&
  !image &&
  !imageMobile;
