// File: nesora-app/src/lib/api.ts
import { authClient } from "@/lib/auth-client";
import { API_URL } from "@/lib/config";

// Thin client for the Nesora mobile API (/api/v1/*). Every call sends the
// signed-in session as a Cookie header. Errors come back as ApiError with the
// server's plain-English message, ready to show.

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Options = { method?: "GET" | "POST" | "DELETE"; body?: unknown; query?: Record<string, string | number | null | undefined> };

export async function api<T>(path: string, { method = "GET", body, query }: Options = {}): Promise<T> {
  const url = new URL(`${API_URL}/api/v1${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== null && value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }

  // Secure storage isn't available on web previews; there the browser sends cookies.
  const cookie = await authClient.getCookie().catch(() => "");
  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: cookie ? "omit" : "include", // native: cookie sent by hand above
    });
  } catch {
    throw new ApiError(0, "NETWORK", "You're offline. Check your connection and try again.");
  }

  const data = (await res.json().catch(() => null)) as { error?: { code: string; message: string } } | null;
  if (!res.ok) {
    if (res.status === 401) {
      // Session expired or account suspended → back to the login screen.
      await authClient.signOut().catch(() => {});
    }
    throw new ApiError(res.status, data?.error?.code ?? "ERROR", data?.error?.message ?? "Something went wrong. Try again.");
  }
  return data as T;
}