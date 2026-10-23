import type { CardEditorialNewsProps } from "@components/molecules/CardEditorialNews/types";
import type { SectionBackground } from "@utils/background";

export type ArchiveListProps = {
  title: string;
  paragraph?: string | null;
  items: CardEditorialNewsProps[];
  background?: SectionBackground;
  labelButton?: string;
  linkTo?: string;
  openInNewTab?: boolean;
};
