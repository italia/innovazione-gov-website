export type ArticleIntroDetail = {
  label: string;
  paragraph: string;
};

export type ArticleIntroProps = {
  title?: string | null;
  paragraph?: string | null;
  topicLinks?: Record<string, string>;
  topicsTitle?: string | null;
  topics?: string[];
  details?: ArticleIntroDetail[];
};
