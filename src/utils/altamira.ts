/**
 * Base del career site Altamira (es. https://recruitment.innovazione.gov.it),
 * da ALTAMIRA_RECRUITMENT_URL. Senza variabile i link restano interni.
 */
function recruitmentBaseUrl(): string | null {
  const metaEnv = (
    import.meta as ImportMeta & {
      env?: Record<string, string | undefined>;
    }
  ).env;
  const value =
    metaEnv?.ALTAMIRA_RECRUITMENT_URL ?? process.env.ALTAMIRA_RECRUITMENT_URL;
  return value?.trim().replace(/\/+$/, "") || null;
}

/**
 * Slug del career site per un annuncio: titolo + area, ogni sequenza di
 * caratteri che non sono lettere o cifre diventa "-", accenti compresi
 * ("Unità" resta "Unità"). Verificato sugli annunci pubblicati.
 */
export function altamiraSlug(value: string): string {
  return value.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
}

let warned = false;

/**
 * Link all'annuncio sul career site Altamira. Il sito risolve l'annuncio solo
 * dal JobID finale: la parte di slug prima è decorativa, quindi usiamo lo slug
 * del record CMS. Il JobID arriva com'è mostrato in dashboard ("190.438.933"):
 * teniamo solo le cifre. Senza cifre valide o senza URL base restituisce null.
 */
export function altamiraJobUrl(
  jobId: string | null | undefined,
  slug: string | null | undefined,
): string | null {
  const id = (jobId ?? "").replace(/\D/g, "");
  if (!id) return null;
  const base = recruitmentBaseUrl();
  if (!base) {
    if (!warned) {
      console.warn(
        "[altamira] ALTAMIRA_RECRUITMENT_URL non impostata: le posizioni con JobID puntano alla pagina interna.",
      );
      warned = true;
    }
    return null;
  }
  const prefix = (slug ?? "").trim().replace(/^\/+|\/+$/g, "") || "annuncio";
  return `${base}/jobs/${encodeURIComponent(prefix)}-${id}.htm`;
}
