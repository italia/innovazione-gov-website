const oggi = () => new Date().toISOString().slice(0, 10);

/**
 * Una selezione risulta aperta solo finché la data di chiusura è nel futuro:
 * nel CMS restano posizioni con lo stato "aperto" e il bando scaduto da anni.
 */
export function effectivePositionStatus(
  status: string,
  closeDate?: string | null,
): string {
  if (status !== "open") return status;
  return closeDate && closeDate >= oggi() ? "open" : "closed";
}
