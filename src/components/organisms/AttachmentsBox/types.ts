export type AttachmentsBoxBackground =
  "default" | "lighter" | "primary-light" | "primary" | "dark";

export type AttachmentsBoxItem = {
  id: string;
  label: string;
  href: string;
  meta: string;
};

export type AttachmentsBoxProps = {
  title: string;
  items: AttachmentsBoxItem[];
  background?: AttachmentsBoxBackground;
};
