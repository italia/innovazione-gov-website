/**
 * Client server-side per le API REST v3 di Altamira. Le credenziali
 * (ALTAMIRA_USERNAME / ALTAMIRA_PASSWORD, account tech@innovazione.gov.it)
 * non devono mai arrivare al browser: importare questo modulo solo da
 * endpoint, loader o componenti renderizzati sul server.
 */
import { altamiraJobUrl, altamiraSlug } from "@utils/altamira";

const API_BASE = "https://platform.altamirahrm.com/api/v3/REST";

/** Vista "Frontoffice: Lista Annunci_SelezioniChiuse", esposta come API. */
const CLOSED_VIEW = "Frontoffice__Lista_Annunci_SelezioniChiuse";

export type AltamiraFile = { name: string | null; url: string };

export type AltamiraClosedPosition = {
  /** JobID Altamira. */
  id: number;
  title: string;
  /** ISO 8601. */
  publishedAt: string | null;
  /** Fine candidature, ISO 8601. */
  closedAt: string | null;
  office: string | null;
  area: string | null;
  /** Graduatoria pubblicata, se presente. */
  ranking: AltamiraFile | null;
  /** "results" se c'è la graduatoria, altrimenti "closed". */
  status: "results" | "closed";
  /** Annuncio sul career site (null senza ALTAMIRA_RECRUITMENT_URL). */
  url: string | null;
};

type ViewResponse = {
  count?: string | number;
  data?: Record<string, unknown>[] | null;
  result?: { status?: string; details?: { fullDescription?: string }[] }[];
};

function env(key: string): string | undefined {
  const metaEnv = (
    import.meta as ImportMeta & {
      env?: Record<string, string | undefined>;
    }
  ).env;
  return metaEnv?.[key] ?? process.env[key];
}

function apiError(what: string, status: number, body: unknown): Error {
  const detail = (body as ViewResponse)?.result?.[0]?.details?.[0]
    ?.fullDescription;
  return new Error(
    `[altamira] ${what}: HTTP ${status}${detail ? ` (${detail})` : ""}`,
  );
}

async function getToken(): Promise<string> {
  const username = env("ALTAMIRA_USERNAME");
  const password = env("ALTAMIRA_PASSWORD");
  if (!username || !password) {
    throw new Error(
      "[altamira] ALTAMIRA_USERNAME e ALTAMIRA_PASSWORD non impostate",
    );
  }

  const response = await fetch(`${API_BASE}/authentication/getToken`, {
    headers: { username, password, loginRequest: "1" },
  });
  const body = await response.json().catch(() => null);
  const token = body?.data?.[0]?.token;
  if (!response.ok || typeof token !== "string") {
    throw apiError("login", response.status, body);
  }
  return token;
}

async function readView(tagName: string): Promise<Record<string, unknown>[]> {
  const token = await getToken();
  const response = await fetch(
    `${API_BASE}/views/Jobs/${tagName}?paging=false`,
    { headers: { token } },
  );
  const body = (await response.json().catch(() => null)) as ViewResponse;
  if (!response.ok || !body) {
    throw apiError(`vista ${tagName}`, response.status, body);
  }
  return Array.isArray(body.data) ? body.data : [];
}

const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

/** "/Unità di Missione PNRR/" → "Unità di Missione PNRR" (anche più aree). */
function area(value: unknown): string | null {
  const parts = (Array.isArray(value) ? value : [value])
    .map((item) =>
      typeof item === "object" && item
        ? ((item as Record<string, unknown>).name ??
          (item as Record<string, unknown>).text)
        : item,
    )
    .flatMap((item) => (typeof item === "string" ? item.split("/") : []))
    .map((item) => item.trim())
    .filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

/**
 * Il campo file non ha ancora valori su cui verificarne la forma: accetta un
 * URL, un oggetto con url/link/path (+ nome) o un array, prendendo il primo.
 */
function file(value: unknown): AltamiraFile | null {
  const first = Array.isArray(value) ? value[0] : value;
  if (typeof first === "string") {
    return /^https?:\/\//.test(first) ? { name: null, url: first } : null;
  }
  if (!first || typeof first !== "object") return null;
  const record = first as Record<string, unknown>;
  const url = [record.url, record.link, record.path, record.downloadUrl].find(
    (candidate): candidate is string =>
      typeof candidate === "string" && /^https?:\/\//.test(candidate),
  );
  if (!url) return null;
  return {
    name: text(record.fileName) ?? text(record.name) ?? text(record.title),
    url,
  };
}

function toClosedPosition(
  row: Record<string, unknown>,
): AltamiraClosedPosition | null {
  const id = Number(row.id);
  const title = text(row.Jobs_Title);
  if (!Number.isInteger(id) || !title) return null;

  const positionArea = area(row.Vacancy_BusinessUnits);
  const ranking = file(row.z160423376annuncicampipersonalizzati_GraduatoriaJob);

  return {
    id,
    title,
    publishedAt: text(row.Jobs_DatePublished),
    closedAt: text(row.Jobs_DateToUnpublish),
    office: text(row.Locations_LocationsSingle),
    area: positionArea,
    ranking,
    status: ranking ? "results" : "closed",
    url: altamiraJobUrl(
      String(id),
      altamiraSlug(`${title} ${positionArea ?? ""}`),
    ),
  };
}

/** Selezioni chiuse su Altamira, dalla più recente per data di chiusura. */
export async function getAltamiraClosedPositions(): Promise<
  AltamiraClosedPosition[]
> {
  const rows = await readView(CLOSED_VIEW);
  return rows
    .map(toClosedPosition)
    .filter((position): position is AltamiraClosedPosition => !!position)
    .sort((a, b) =>
      (b.closedAt ?? b.publishedAt ?? "").localeCompare(
        a.closedAt ?? a.publishedAt ?? "",
      ),
    );
}
