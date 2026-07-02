import { Chip } from "@components/react/Chip";
import "./style.scss";

type FilterPillsProps = {
  categories: string[];
  selectedCategory: string;
  filterTitle: string;
  onCategoryChange: (value: string) => void;
};

export function FilterPills({
  categories,
  selectedCategory,
  filterTitle,
  onCategoryChange,
}: FilterPillsProps) {
  return (
    <div className="it-list-wrapper filter-pills d-flex flex-column">
      <p
        id="filterPagination"
        className="it-label text-dark mt-1 fw-semibold text-uppercase"
      >
        {filterTitle}
      </p>

      <div
        className="d-flex flex-wrap gap-2 mt-2"
        role="group"
        aria-labelledby="filterPagination"
      >
        {categories.map((category) => (
          <Chip
            key={category}
            label={category}
            visuallyHidden={category}
            variant="primary"
            active={category === selectedCategory}
            onClick={() => onCategoryChange(category)}
          />
        ))}
      </div>
    </div>
  );
}
