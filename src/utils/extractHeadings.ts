import { slugify } from "@utils/slugify";

type DastNode = {
  type?: string;
  level?: number;
  value?: string;
  children?: DastNode[];
  document?: DastNode;
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
