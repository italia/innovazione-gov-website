export type PositionMeta = {
  label: string;
  value: string;
};

export type PositionHeroProps = {
  title: string;
  paragraph?: string | null;
  meta: PositionMeta[];
  topics?: string[];
};
