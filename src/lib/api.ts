const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

if (!API_BASE_URL) {
  // Fails loudly at build/dev time rather than quietly hitting a
  // relative path that happens to 404 - same "warn clearly, don't
  // silently degrade" instinct as the backend's own config module.
  throw new Error(
    "VITE_API_BASE_URL is not set. Add it to .env.local, e.g. " +
      "VITE_API_BASE_URL=https://reconflow-ai.onrender.com",
  );
}

const TOKEN_STORAGE_KEY = "reconflow.token";

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * The shape every module in the backend raises errors as -
 * {"error_code": "...", "message": "..."} - confirmed identical across
 * all 17 modules, so one error type here covers the whole API.
 */
export class ApiError extends Error {
  status: number;
  errorCode: string | null;

  constructor(status: number, errorCode: string | null, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = errorCode;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Set true when `body` is already a FormData instance (file uploads) -
   * skips JSON.stringify and lets the browser set the multipart
   * Content-Type boundary itself. */
  isFormData?: boolean;
}

/**
 * Every authenticated call in this app goes through here so that the
 * auth header and the 401-means-log-out behavior live in exactly one
 * place, rather than being repeated (and inevitably drifting) in every
 * component that calls the API.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (!options.isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body:
      options.body === undefined
        ? undefined
        : options.isFormData
          ? (options.body as FormData)
          : JSON.stringify(options.body),
  });

  if (response.status === 401) {
    // The backend's session tokens last 24h with no refresh endpoint -
    // a 401 here always means "log in again", never "retry silently".
    clearToken();
    window.location.href = "/login";
    throw new ApiError(401, "UNAUTHENTICATED", "Session expired - please log in again.");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body?.detail ?? body;
    throw new ApiError(
      response.status,
      detail?.error_code ?? null,
      detail?.message ?? `Request failed with status ${response.status}.`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
