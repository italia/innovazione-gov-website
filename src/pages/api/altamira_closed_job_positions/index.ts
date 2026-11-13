import { getAltamiraClosedPositions } from "@lib/altamira";
import { invalidRequestResponse, json, withCORS } from "@utils/apiUtils";
import type { APIRoute } from "astro";

export const prerender = false;

export const OPTIONS: APIRoute = () => new Response("OK", withCORS());

/**
 * Selezioni chiuse da Altamira, come array JSON. Il login con le credenziali
 * dell'account API avviene qui sul server; la CDN tiene la risposta 15 minuti
 * (e la serve ancora per un'ora mentre la rinnova), così Altamira riceve al
 * più una coppia di chiamate ogni quarto d'ora.
 */
export const GET: APIRoute = async () => {
  try {
    const positions = await getAltamiraClosedPositions();
    return json(
      positions,
      withCORS({
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "public, max-age=0, must-revalidate",
          "CDN-Cache-Control":
            "public, s-maxage=900, stale-while-revalidate=3600",
        },
      }),
    );
  } catch (error) {
    console.error(error);
    return invalidRequestResponse(
      error instanceof Error ? error.message : "Altamira non raggiungibile",
      502,
    );
  }
};
