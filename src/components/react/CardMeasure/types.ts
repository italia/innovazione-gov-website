import type { SiteLocale } from "@graphql/types";

export type CardMeasureProps = {
  title: string;
  description: string;
  category: string[];
  benefits: string[];
  goalAchieved: number;
  totalGoal: number;
  lang: SiteLocale;
};
