import { DatoBlockModel } from "@utils/cmsMapper";
import { extractHeadings } from "@utils/extractHeadings";
import { slugify } from "@utils/slugify";

export type PageSectionNavItem = {
  id: string;
  label: string;
};

const TITOLO_NEL_TESTO: string[] = [
  DatoBlockModel.TextImage,
  DatoBlockModel.TextAccordion,
  DatoBlockModel.TextOnly,
  DatoBlockModel.TextStatistic,
  DatoBlockModel.TextUseCase,
];

const TITOLO_DIRETTO: string[] = [
  DatoBlockModel.ListCollection,
  DatoBlockModel.CardLinkList,
  DatoBlockModel.FaqSection,
  DatoBlockModel.Timeline,
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const stringa = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

function titoloSezione(block: Record<string, unknown>): string | null {
  const componentName = stringa(block.componentName);
  if (!componentName) return null;
  if (TITOLO_DIRETTO.includes(componentName)) return stringa(block.title);
  if (TITOLO_NEL_TESTO.includes(componentName)) {
    return isRecord(block.text) ? stringa(block.text.title) : null;
  }
  return null;
}

export function extractPageSections(
  content: readonly unknown[] | null | undefined,
  livelliTitoli: number[] = [2, 3],
): PageSectionNavItem[] {
  const items: PageSectionNavItem[] = [];
  const visti = new Set<string>();

  const aggiungi = (label: string | null, id: string) => {
    if (!label || !id || visti.has(id)) return;
    visti.add(id);
    items.push({ id, label });
  };

  const conEtichetta = (content ?? []).filter(
    (block) => isRecord(block) && stringa(block.menuLabel),
  );

  if (conEtichetta.length) {
    conEtichetta.forEach((block) => {
      if (!isRecord(block)) return;
      const etichetta = stringa(block.menuLabel);
      const ancora = titoloSezione(block) ?? etichetta;
      aggiungi(etichetta, ancora ? slugify(ancora) : "");
    });
    return items;
  }

  (content ?? []).forEach((block) => {
    if (!isRecord(block)) return;

    if (stringa(block.componentName) === DatoBlockModel.StructuredText) {
      const testo = isRecord(block.textContent)
        ? block.textContent.value
        : null;
      extractHeadings(testo, livelliTitoli).forEach((heading) =>
        aggiungi(heading.text, heading.id),
      );
      return;
    }

    const label = titoloSezione(block);
    aggiungi(label, label ? slugify(label) : "");
  });

  return items;
}

const BLOCCHI_INTRO: string[] = [DatoBlockModel.Hero, DatoBlockModel.LinkMenu];

export function splitPageIntro<T>(content: readonly T[] | null | undefined) {
  const blocchi = content ?? [];
  let fine = blocchi.length ? 1 : 0;
  while (fine < blocchi.length) {
    const blocco = blocchi[fine];
    const componentName = isRecord(blocco)
      ? stringa(blocco.componentName)
      : null;
    if (!componentName || !BLOCCHI_INTRO.includes(componentName)) break;
    fine += 1;
  }
  return { intro: blocchi.slice(0, fine), rest: blocchi.slice(fine) };
}
