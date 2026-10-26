import {
  handleUnexpectedError,
  invalidRequestResponse,
  json,
  withCORS,
} from "@utils/apiUtils";
import { generateWebsiteUrl } from "@utils/generateWebsiteUrl";
import type { APIRoute } from "astro";

export const prerender = false;

export const OPTIONS: APIRoute = ({ request }) => {
  return new Response("OK", withCORS());
};

type PreviewLink = {
  label: string;
  url: string;
  reloadPreviewOnRecordUpdate?: boolean | { delayInMs: number };
};

type WebPreviewsResponse = {
  previewLinks: PreviewLink[];
};

export const POST: APIRoute = async ({ url, request }) => {
  const body = await request.json();
  const { item, itemType, locale } = body;
  const type = itemType?.attributes?.api_key;
  const id = item?.id;

  try {
    const token = url.searchParams.get("token");

    if (token !== import.meta.env.SECRET_API_TOKEN) {
      return invalidRequestResponse("Invalid token", 401);
    }

    const recordUrl = generateWebsiteUrl(id, item, locale);

    const response: WebPreviewsResponse = { previewLinks: [] };

    const isLocal = process.env.NODE_ENV === "development";

    const protocol = isLocal ? "http" : "https";

    const host =
      request.headers.get("x-forwarded-host") || request.headers.get("host");

    // A frontend can be served from one host and linked on another: the panel
    // may call a local server while the links have to open the deployed site.
    // PREVIEW_SITE_URL pins the host of the links, `base` does the same per
    // webhook, and without either the host of the request is used.
    const pinned =
      import.meta.env.PREVIEW_SITE_URL || url.searchParams.get("base");
    const pinnedOrigin = pinned?.startsWith("http")
      ? new URL(pinned).origin
      : undefined;

    const origin =
      pinnedOrigin ??
      (host ? `${protocol}://${host}` : import.meta.env.SITE_URL || url.origin);

    if (recordUrl) {
      response.previewLinks.push({
        label: "Draft version",
        url: new URL(
          `/api/draft-mode/enable?url=${recordUrl}&token=${token}&type=${type}&id=${id}`,
          origin,
        ).toString(),
      });

      if (item.meta.status !== "draft") {
        response.previewLinks.push({
          label: "Published version",
          url: new URL(
            `/api/draft-mode/disable?url=${recordUrl}&type=${type}&id=${id}`,
            origin,
          ).toString(),
        });
      }
    }

    return json(response, withCORS());
  } catch (error) {
    return handleUnexpectedError(error);
  }
};
