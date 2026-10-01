export type AccordionProps = {
  id: string;
  items: AccordionItemProps[];
  variant?: VariantAccordionProps;
  label?: string;
};

export type AccordionItemCta = {
  componentName: string;
  label: string;
  url?: string | null;
  linkTo?: { id: string } | null;
};

export type AccordionItemProps = {
  header: string;
  body: string;
  id: string;
  cta?: AccordionItemCta | null;
};

export type VariantAccordionProps = "default" | "background-active";
