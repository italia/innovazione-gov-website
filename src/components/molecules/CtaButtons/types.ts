export type CtaButtonItem = {
  id: string;
  label: string;
  linkTo: string;
  isExternal: boolean;
  outline: boolean;
};

export type CtaButtonsProps = {
  items: CtaButtonItem[];
};
