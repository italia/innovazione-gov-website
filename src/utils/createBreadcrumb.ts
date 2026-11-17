import type { SiteLocale } from "@graphql/types";
import { getI18n } from "@i18n/microcopy";
import { getBreadcrumbs, linkResolver } from "@utils/linkResolver";

export type BreadcrumbItem = {
  label: string;
  linkTo: string;
  active: boolean;
  id: string;
};

export function breadcrumbStepLabel(
  step: { title: string },
  index: number,
  locale: SiteLocale,
) {
  return index === 0 ? getI18n(locale)["breadcrumb.root"] : step.title;
}

export function createBreadcrumb(id: string, locale: SiteLocale) {
  const steps = getBreadcrumbs(id, locale);

  if (!steps.length) {
    return [];
  }

  const breadcrumbs = steps.map((step, index) => {
    const linkTo = linkResolver(step.id, locale);

    const label = breadcrumbStepLabel(step, index, locale);

    return { label, linkTo, active: false, id: label };
  });

  breadcrumbs[breadcrumbs.length - 1].active = true;
  return breadcrumbs;
}

export function compactBreadcrumb(
  items: BreadcrumbItem[],
  lastLabel: string,
): BreadcrumbItem[] {
  if (items.length === 0) return items;

  const ultimo = {
    ...items[items.length - 1],
    label: lastLabel,
    id: lastLabel,
  };

  if (items.length <= 2) return [...items.slice(0, -1), ultimo];

  return [items[0], items[items.length - 2], ultimo];
}
