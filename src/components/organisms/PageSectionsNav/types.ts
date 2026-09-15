import type { PageSectionNavItem } from "@utils/pageSections";

export type PageSectionsNavVariant = "horizontal" | "sidebar";

export type PageSectionsNavProps = {
  header: string;
  items: PageSectionNavItem[];
  variant?: PageSectionsNavVariant;
};
