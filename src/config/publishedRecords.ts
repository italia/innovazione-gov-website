/**
 * Provisional landing: production builds only generate the pages in this
 * allowlist (plus homepage and 404). Every other DatoCMS record stays
 * untouched on the CMS, ready for the final site.
 *
 * The mode is decided by the build command (scripts/run-env.ts):
 *   - staging    → SHOW_ALL_PAGES=true  → every page (historical behavior)
 *   - production → SHOW_ALL_PAGES=false → allowlist only
 * When the variable is missing the restrictive default applies (fail-closed).
 * To publish the full site again, extend the list or remove the filter.
 */
const LANDING_RECORD_IDS = new Set<string>([
  "G4U4OKlCR8Ga_kqDtnvlXg", // catalogue "Le misure" → /it/le-misure
  "QpO3I04YSr2kZUJEFiqziw", // page "Privacy policy" → /it|en/privacy-policy
  "R2GJSq-DRSiVZBP4pIS3BQ", // page "Note legali" → /it/note-legali, /en/legal-notice
]);

// Injected by Vite at build time (astro.config.ts) so the flag also holds in
// serverless routes at runtime, where process.env cannot be configured.
declare const __SHOW_ALL_PAGES__: boolean | undefined;

export function showAllPages(): boolean {
  if (typeof __SHOW_ALL_PAGES__ !== "undefined") {
    return __SHOW_ALL_PAGES__;
  }
  // Outside Vite (bun scripts) the environment variable applies
  const metaEnv = (
    import.meta as ImportMeta & {
      env?: Record<string, string | undefined>;
    }
  ).env;
  return (metaEnv?.SHOW_ALL_PAGES ?? process.env.SHOW_ALL_PAGES) === "true";
}

export function isRecordPublished(id: string): boolean {
  return showAllPages() || LANDING_RECORD_IDS.has(id);
}
