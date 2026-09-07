export const createDownloadUrl = (doc?: {
  url: string;
  filename: string;
  format: string;
}): string => {
  if (!doc) return "#";
  const suffisso = `.${doc.format}`;
  const nome = doc.filename.toLowerCase().endsWith(suffisso.toLowerCase())
    ? doc.filename
    : `${doc.filename}${suffisso}`;
  return `${doc.url}?dl=${nome}`;
};
