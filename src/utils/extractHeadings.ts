import { slugify } from "@utils/slugify";

type DastNode = {
  type?: string;
  level?: number;
  value?: string;
  item?: string;
  children?: DastNode[];
  document?: DastNode;
};

type BloccoConTitolo = {
  id: string;
  __typename?: string;
  title?: string | null;
};

export type ArticleHeading = { id: string; text: string };

function nodeText(node: DastNode): string {
  if (typeof node.value === "string") return node.value;
  return (node.children ?? []).map(nodeText).join("");
}

export function extractHeadings(
  value: unknown,
  levels: number[] = [3],
): ArticleHeading[] {
  const root = (value as DastNode)?.document ?? (value as DastNode);
  const headings: ArticleHeading[] = [];

  const walk = (node?: DastNode) => {
    if (!node) return;
    if (node.type === "heading" && levels.includes(node.level ?? 0)) {
      const text = nodeText(node).trim();
      if (text) headings.push({ id: slugify(text), text });
    }
    (node.children ?? []).forEach(walk);
  };

  walk(root);
  return headings;
}

const TIPI_CON_TITOLO = ["ListExternalLinkRecord", "AttachmentsBoxRecord"];

export function extractIndice(
  value: unknown,
  blocchi: BloccoConTitolo[],
  levels: number[] = [2, 3],
): ArticleHeading[] {
  const root = (value as DastNode)?.document ?? (value as DastNode);
  const voci: ArticleHeading[] = [];
  const perId = new Map(blocchi.map((blocco) => [blocco.id, blocco]));

  const walk = (node?: DastNode) => {
    if (!node) return;
    if (node.type === "heading" && levels.includes(node.level ?? 0)) {
      const text = nodeText(node).trim();
      if (text) voci.push({ id: slugify(text), text });
    }
    if (node.type === "block" && typeof node.item === "string") {
      const blocco = perId.get(node.item);
      const titolo = blocco?.title?.trim();
      if (titolo && TIPI_CON_TITOLO.includes(blocco?.__typename ?? ""))
        voci.push({ id: slugify(titolo), text: titolo });
    }
    (node.children ?? []).forEach(walk);
  };

  walk(root);
  return voci;
}
