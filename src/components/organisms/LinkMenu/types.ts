import type { SectionBackground } from "@utils/background";

export type LinkMenuItem = {
  label: string;
  linkTo: string;
  isExternal: boolean;
};

export type LinkMenuProps = {
  title?: string | null;
  items: LinkMenuItem[];
  background?: SectionBackground;
};
