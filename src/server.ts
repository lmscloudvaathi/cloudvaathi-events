import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { runWithCloudflareBindings, closeWorkerMysql } from "./lib/server/env";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

function formatErrorForDev(error: unknown): string | undefined {
  if (process.env.NODE_ENV === "production") return undefined;
  if (error instanceof Error) return error.stack ?? error.message;
  return String(error);
}

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(detail?: string): Response {
  return new Response(renderErrorPage(detail), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

/** Browsers still probe `/favicon.ico`; serve our SVG via redirect so the console stays clean. */
function faviconIcoRedirect(request: Request): Response | null {
  const url = new URL(request.url);
  if (url.pathname !== "/favicon.ico") return null;
  return Response.redirect(new URL("/CloudVaathiLogo.png", url.origin).href, 302);
}

export default {
  fetch(request: Request, env: unknown, ctx: unknown) {
    return runWithCloudflareBindings(
      env ?? {},
      async () => {
        try {
          const early = faviconIcoRedirect(request);
          if (early) return early;

          const handler = await getServerEntry();
          const response = await handler.fetch(request, env, ctx);
          return await normalizeCatastrophicSsrResponse(response);
        } catch (error) {
          console.error(error);
          return brandedErrorResponse(formatErrorForDev(error));
        } finally {
          await closeWorkerMysql();
        }
      },
      request,
    );
  },
};
