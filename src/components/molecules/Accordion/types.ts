export type AccordionHeadingLevel = "h2" | "h3" | "h4" | "h5";

export type AccordionProps = {
  id: string;
  items: AccordionItemProps[];
  variant?: VariantAccordionProps;
  label?: string;
  headingLevel?: AccordionHeadingLevel;
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
