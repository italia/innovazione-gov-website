export const fileMeta = (doc?: {
  format?: string | null;
  size?: number | null;
}): string => {
  if (!doc) return "";
  const estensione = (doc.format ?? "").toUpperCase();
  const megabyte = doc.size ? (doc.size / 1024 / 1024).toFixed(1) : null;
  if (!estensione && !megabyte) return "";
  return megabyte ? `${estensione} (${megabyte}mb)` : estensione;
};
