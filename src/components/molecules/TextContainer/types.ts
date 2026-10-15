export type TextContainerProps = {
  title: string;
  paragraph: string;
  variant?: TextContainerVariant;
  labelButton?: string;
  linkTo?: string;
  labelButtonSecondary?: string;
  linkToSecondary?: string;
  openInNewTabSecondary?: boolean;
  heading?: HeadingTag;
  openInNewTab?: boolean;
};

export type TextContainerVariant = "light" | "dark" | "primary";
export type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5";
