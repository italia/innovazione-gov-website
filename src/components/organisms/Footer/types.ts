import type { ImageProps } from "@components/atoms/Image/types";
import type { LinkProps } from "@components/atoms/Link/types";

export type FooterProps = {
  brand: FooterBrandProps;
  /** Colonna "Contatti": arriva da DatoCMS al passaggio 2, per ora opzionale. */
  contacts?: FooterContactsProps;
  social?: FooterSocialProps;
  /** Colonne di link titolate (es. "Altri siti web", "Trasparenza"). */
  columns?: FooterColumnProps[];
  mailingListForm?: MailingListFormProps;
  smallPrints: FooterSmallPrintsProps;
};

export type FooterBrandProps = {
  logo?: Pick<ImageProps, "url" | "width" | "height" | "alt">;
  name: string;
  linkTo: string;
  /** Il logo contiene già il nome (lockup): niente testo accanto, nome nell'alt. */
  nameInLogo?: boolean;
};

export type FooterContactsProps = {
  title: string;
  /** Testo (anche HTML) dell'indirizzo. */
  address: string;
  /** Id dello sprite Bootstrap Italia, es. "it-pa". */
  icon?: string;
};

export type FooterSocialProps = {
  title: string;
  items: FooterLinkSupportingBrandProps[];
};

export type FooterColumnProps = {
  title: string;
  links: FooterLinkProps[];
};

export type FooterSmallPrintsProps = {
  links: LinkProps[];
  showSitemap?: boolean;
};

export type FooterLinkSupportingBrandProps = {
  /** URL di un'immagine oppure id dello sprite BI ("it-facebook"). */
  icon?: string;
  label: string;
  url: string;
};

export type FooterLinkProps = {
  label: string;
  linkTo?: string;
  url?: string;
  openInNewTab?: boolean;
  variant?: "dark" | "light";
  titleIcon?: string;
  isIcon?: boolean;
  /** Mostra l'icona "esterno" accanto ai link con url (default true). */
  externalIcon?: boolean;
};

export type MailingListFormProps = {
  title: string;
  privacyPolicy: FooterLinkProps;
};
