const API_FALLBACK = "http://localhost:4000/api";

const getApiBaseUrl = () => {
  const desktopUrl = window.syncupDesktop?.getApiBaseUrl();
  const desktopUrlLegacy = window.syncuDesktop?.getApiBaseUrl?.();
  const resolved = desktopUrl ?? desktopUrlLegacy;
  return resolved ? `${resolved}/api` : API_FALLBACK;
};

const getToken = () => localStorage.getItem("syncup-token") ?? localStorage.getItem("syncu-token");

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const apiRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const headers = new Headers(init?.headers ?? {});
  headers.set("Content-Type", "application/json");

  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(body?.message ?? "Request failed.", response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};
