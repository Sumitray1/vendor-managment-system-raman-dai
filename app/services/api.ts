"use client";

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function hasJsonContentType(res: Response) {
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json");
}

async function safeReadBody(res: Response) {
  try {
    if (res.status === 204) return null;
    if (hasJsonContentType(res)) return await res.json();
    return await res.text();
  } catch {
    return null;
  }
}

export async function apiFetch<T>(
  input: RequestInfo | URL,
  init?: (RequestInit & { json?: unknown }) | undefined,
): Promise<T> {
  const { json, headers, ...rest } = init ?? {};

  const nextInit: RequestInit = {
    ...rest,
    headers: {
      ...(headers ?? {}),
    },
  };

  if (json !== undefined) {
    nextInit.body = JSON.stringify(json);
    const h = new Headers(nextInit.headers);
    if (!h.has("Content-Type")) h.set("Content-Type", "application/json");
    nextInit.headers = h;
  }

  const res = await fetch(input, nextInit);
  const body = await safeReadBody(res);

  if (!res.ok) {
    const message =
      body && typeof body === "object" && "error" in body
        ? String((body as { error?: unknown }).error ?? "Request failed")
        : `Request failed (HTTP ${res.status})`;
    throw new ApiError(message, res.status, body);
  }

  return body as T;
}

