import {
  CardEditorialNews,
  type CardEditorialNewsProps,
} from "@components/react/CardEditorialNews";
import {
  CardEditorialStory,
  type CardEditorialStoryProps,
} from "@components/react/CardEditorialStory";
import {
  CardMeasure,
  type CardMeasureProps,
} from "@components/react/CardMeasure";
import { FilterPills } from "@components/react/FilterPills";
import { Pagination } from "@components/react/Pagination";
import type { SiteLocale } from "@graphql/types";
import { slugify } from "@utils/slugify";
import { useEffect, useState } from "react";
import { Resource, type ResourceProps } from "../Resource";
import { Select } from "../Select";
type PaginatedCollectionCommonProps = {
  title: string;
  paragraph: string;
  filterTitle: string;
  labelForAll: string;
  lang: SiteLocale;
  filterStyle?: string[];
  /** Ordine editoriale delle categorie (label); le assenti finiscono in coda. */
  categoriesOrder?: string[];
  perPage?: number;
};

type PaginatedCollectionProps =
  | (PaginatedCollectionCommonProps & {
      items: CardEditorialNewsProps[];
      newsPageTabType: "news_item";
    })
  | (PaginatedCollectionCommonProps & {
      items: CardEditorialStoryProps[];
      newsPageTabType: "story_item";
    })
  | (PaginatedCollectionCommonProps & {
      items: CardEditorialNewsProps[];
      newsPageTabType: "webinar_item";
    })
  | (PaginatedCollectionCommonProps & {
      items: ResourceProps[];
      newsPageTabType: "resource";
    })
  | (PaginatedCollectionCommonProps & {
      items: CardMeasureProps[];
      newsPageTabType: "measures";
    });

export function PaginatedCollection({
  items,
  perPage = 6,
  title,
  paragraph,
  filterTitle,
  labelForAll,
  newsPageTabType,
  filterStyle,
  categoriesOrder,
  lang,
}: PaginatedCollectionProps) {
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(labelForAll);

  const derivedCategories = Array.from(
    new Set(
      items
        .flatMap((item) => item.category)
        .filter((c): c is string => typeof c === "string"),
    ),
  );

  // Con un ordine editoriale (position su DatoCMS) le categorie lo seguono;
  // quelle non previste finiscono in coda mantenendo l'ordine di apparizione.
  if (categoriesOrder?.length) {
    const rank = new Map(categoriesOrder.map((label, i) => [label, i]));
    derivedCategories.sort(
      (a, b) => (rank.get(a) ?? Infinity) - (rank.get(b) ?? Infinity),
    );
  }

  const categories: string[] = [labelForAll, ...derivedCategories];

  // Deep-link del filtro: ?filter=<slug della categoria> (es. arrivando
  // dalle slide del carosello). Il match è sullo slug della label, così non
  // serve nessuna mappa manuale slug → categoria.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("filter");
    if (!param) return;
    const match = categories.find((c) => slugify(c) === param);
    if (match) setSelectedCategory(match);
  }, []);

  const filteredItems =
    selectedCategory === labelForAll
      ? items
      : items.filter((item) => item.category?.includes(selectedCategory));

  const totalPages = Math.ceil(filteredItems.length / perPage);
  const start = (page - 1) * perPage;
  const paginatedItems = filteredItems.slice(start, start + perPage);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(1);
  };

  const isPills = filterStyle?.includes("pills") ?? false;
  const isMeasures = newsPageTabType === "measures";

  return (
    <div className="container">
      <div className="d-flex flex-lg-row flex-column justify-content-between align-items-top">
        <div className="col-lg-5 col-12">
          <div className={`text-container mb-4 mb-lg-0`}>
            <h2 className="mb-3">{title}</h2>
            <div className="mb-4">{paragraph}</div>
          </div>
        </div>
        <div className="col-lg-4 col-12">
          {isPills ? (
            <FilterPills
              filterTitle={filterTitle}
              selectedCategory={selectedCategory}
              categories={categories}
              onCategoryChange={handleCategoryChange}
            />
          ) : (
            <Select
              filterTitle={filterTitle}
              selectedCategory={selectedCategory}
              categories={categories}
              onCategoryChange={handleCategoryChange}
            />
          )}
        </div>
      </div>

      {isMeasures ? (
        <div className="accordion pt-4">
          {paginatedItems.map((n) => (
            <CardMeasure key={n.title} {...(n as CardMeasureProps)} />
          ))}
        </div>
      ) : (
        <ul className="it-card-list row pt-4">
          {paginatedItems.map((n) => {
            const isResource = newsPageTabType === "resource";
            const colClass = isResource
              ? "col-12 col-lg-7 mb-3"
              : "col-12 col-lg-4 mb-5";

            const itemKey = n.title;

            return (
              <li className={colClass} key={itemKey}>
                {newsPageTabType === "news_item" && (
                  <CardEditorialNews {...(n as CardEditorialNewsProps)} />
                )}

                {newsPageTabType === "story_item" && (
                  <CardEditorialStory {...(n as CardEditorialStoryProps)} />
                )}

                {newsPageTabType === "webinar_item" && (
                  <CardEditorialNews {...(n as CardEditorialNewsProps)} />
                )}

                {newsPageTabType === "resource" && (
                  <Resource {...(n as ResourceProps)} />
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Pagination
        lang={lang}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
