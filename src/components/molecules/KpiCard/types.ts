export type KpiCardIcon = {
  url: string;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
};

export type KpiCardProps = {
  title: string;
  value: string;
  description?: string | null;
  icon?: KpiCardIcon | null;
};
