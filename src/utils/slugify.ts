/**
 * Converte una label in uno slug URL-safe (es. "Infrastrutture, Sicurezza e
 * Connettività" → "infrastrutture-sicurezza-e-connettivita"). Usato per i
 * deep-link dei filtri: lo stesso slug viene generato lato link e confrontato
 * lato filtro, così label e URL restano allineati senza mapping manuali.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
