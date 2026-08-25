import type { SiteLocale } from "@graphql/types";
import { getI18n } from "@i18n/microcopy";
import { getBreadcrumbs, linkResolver } from "@utils/linkResolver";

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
