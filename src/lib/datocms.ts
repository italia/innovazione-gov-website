import {
  executeQueryWithAutoPagination,
  executeQuery as libExecuteQuery,
} from "@datocms/cda-client";
import type { TadaDocumentNode } from "gql.tada";

export async function executeQuery<Result, Variables>(
  query: TadaDocumentNode<Result, Variables>,
  options?: ExecuteQueryOptions<Variables>,
) {
  const metaEnv = (
    import.meta as ImportMeta & {
      env?: Record<string, string | undefined>;
    }
  ).env;

  const getEnv = (key: string) => metaEnv?.[key] ?? process.env[key];

  const token = getEnv("DATOCMS_API_TOKEN");

  // Strict mode stays on for drafts too: the generated schema (and every
  // fragment written against it, AltImageFragment included) only knows the
  // narrowed types the API exposes with X-Exclude-Invalid, so turning it off
  // made the preview queries invalid.
  const excludeInvalid = options?.excludeInvalid ?? true;

  const result = await libExecuteQuery(query, {
    variables: options?.variables,
    excludeInvalid,
    includeDrafts: options?.includeDrafts,
    environment: getEnv("DATOCMS_ENVIRONMENT"),
    token,
  });

  return result;
}

export async function executeAutoPagingQuery<Result, Variables>(
  query: TadaDocumentNode<Result, Variables>,
  options?: ExecuteQueryOptions<Variables>,
) {
  const metaEnv = (
    import.meta as ImportMeta & {
      env?: Record<string, string | undefined>;
    }
  ).env;

  const getEnv = (key: string) => metaEnv?.[key] ?? process.env[key];

  const token = getEnv("DATOCMS_API_TOKEN");

  // Strict mode stays on for drafts too: the generated schema (and every
  // fragment written against it, AltImageFragment included) only knows the
  // narrowed types the API exposes with X-Exclude-Invalid, so turning it off
  // made the preview queries invalid.
  const excludeInvalid = options?.excludeInvalid ?? true;

  const result = await executeQueryWithAutoPagination(query, {
    variables: options?.variables,
    excludeInvalid,
    includeDrafts: options?.includeDrafts,
    environment: getEnv("DATOCMS_ENVIRONMENT"),
    token,
  });

  return result;
}

type ExecuteQueryOptions<Variables> = {
  variables?: Variables;
  includeDrafts?: boolean;
  excludeInvalid?: boolean;
};
