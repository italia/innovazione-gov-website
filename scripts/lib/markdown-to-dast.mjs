const INLINE_PATTERN =
  /\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*\n]+)\*|(?<![A-Za-z0-9])_([^_\n]+)_(?![A-Za-z0-9])/g;

const span = (value, marks) =>
  marks ? { type: "span", marks, value } : { type: "span", value };

export function inlineNodes(text) {
  const nodes = [];
  let cursor = 0;
  for (const match of text.matchAll(INLINE_PATTERN)) {
    const [
      full,
      linkLabel,
      linkUrl,
      strongStars,
      strongUnderscores,
      emStars,
      emUnderscores,
    ] = match;
    if (match.index > cursor) nodes.push(span(text.slice(cursor, match.index)));
    if (linkUrl)
      nodes.push({
        type: "link",
        url: linkUrl,
        children: [span(linkLabel)],
      });
    else if (strongStars ?? strongUnderscores)
      nodes.push(span(strongStars ?? strongUnderscores, ["strong"]));
    else nodes.push(span(emStars ?? emUnderscores, ["emphasis"]));
    cursor = match.index + full.length;
  }
  if (cursor < text.length) nodes.push(span(text.slice(cursor)));
  return nodes.filter((node) => node.type !== "span" || node.value !== "");
}

export function markdownToDastNodes(markdown) {
  const nodes = [];
  let paragraphLines = [];
  let bulletLines = [];

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    const children = inlineNodes(paragraphLines.join(" "));
    paragraphLines = [];
    if (children.length) nodes.push({ type: "paragraph", children });
  };

  const flushBullets = () => {
    if (!bulletLines.length) return;
    const children = bulletLines
      .map((line) => inlineNodes(line))
      .filter((inline) => inline.length)
      .map((inline) => ({
        type: "listItem",
        children: [{ type: "paragraph", children: inline }],
      }));
    bulletLines = [];
    if (children.length)
      nodes.push({ type: "list", style: "bulleted", children });
  };

  for (const rawLine of String(markdown ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")) {
    const bullet = rawLine.match(/^\s*[-*]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      bulletLines.push(bullet[1].trim());
      continue;
    }
    if (!rawLine.trim()) {
      flushParagraph();
      flushBullets();
      continue;
    }
    flushBullets();
    paragraphLines.push(rawLine.trim());
  }
  flushParagraph();
  flushBullets();
  return nodes;
}

export function headingNode(text, level) {
  return { type: "heading", level, children: [span(text)] };
}

export function dastDocument(children) {
  if (!children.length) return null;
  return { schema: "dast", document: { type: "root", children } };
}
