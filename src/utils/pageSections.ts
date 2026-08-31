import type { InsightContentFragmentType } from "@graphql/fragment/insight";
import { DatoBlockModel } from "@utils/cmsMapper";
import { slugify } from "@utils/slugify";

export type PageSectionNavItem = {
  id: string;
  label: string;
};

function sectionTitle(block: InsightContentFragmentType): string | null {
  switch (block.componentName) {
    case DatoBlockModel.TextImage:
    case DatoBlockModel.TextAccordion:
    case DatoBlockModel.TextOnly:
    case DatoBlockModel.TextStatistic:
    case DatoBlockModel.TextUseCase:
      return block.text?.title ?? null;
    case DatoBlockModel.ListCollection:
    case DatoBlockModel.CardLinkList:
    case DatoBlockModel.FaqSection:
    case DatoBlockModel.Timeline:
      return block.title ?? null;
    default:
      return null;
  }
}

export function extractPageSections(
  content: InsightContentFragmentType[] | null | undefined,
): PageSectionNavItem[] {
  const items: PageSectionNavItem[] = [];
  const seen = new Set<string>();

  (content ?? []).forEach((block) => {
    const label = sectionTitle(block)?.trim();
    if (!label) return;
    const id = slugify(label);
    if (!id || seen.has(id)) return;
    seen.add(id);
    items.push({ id, label });
  });

  return items;
}
