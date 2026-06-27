export type CarouselObjectivesSlideData = {
  title?: string | null;
  body?: string | null;
  image?: {
    url: string;
    alt?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
};

export type CarouselObjectivesProps = {
  slides: CarouselObjectivesSlideData[];
};
