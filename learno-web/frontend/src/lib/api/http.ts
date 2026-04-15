import { API_BASE_URL } from "@/lib/config";
import { clearStoredAuth, getStoredToken, setStoredToken } from "@/lib/auth/storage";
import type { ApiErrorShape } from "@/lib/api/types";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type ResponseType = "json" | "text" | "blob";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  auth?: boolean;
  responseType?: ResponseType;
  signal?: AbortSignal;
}

const withQuery = (
  endpoint: string,
  query?: Record<string, string | number | boolean | undefined | null>,
): string => {
  if (!query) {
    return endpoint;
  }

  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    params.set(key, String(value));
  });

  const serialized = params.toString();
  if (!serialized) {
    return endpoint;
  }

  return `${endpoint}?${serialized}`;
};

const parseError = async (response: Response): Promise<ApiErrorShape> => {
  const contentType = response.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      return (await response.json()) as ApiErrorShape;
    }

    const text = await response.text();
    return { message: text || response.statusText };
  } catch {
    return { message: response.statusText || "Request failed" };
  }
};

const shouldAttachJsonBody = (body: unknown): body is object => {
  if (!body) {
    return false;
  }

  if (body instanceof FormData) {
    return false;
  }

  if (body instanceof Blob) {
    return false;
  }

  if (body instanceof URLSearchParams) {
    return false;
  }

  return typeof body === "object";
};

const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { accessToken?: string };
    if (!data.accessToken) {
      return null;
    }

    setStoredToken(data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
};

const performRequest = async <T>(
  endpoint: string,
  options: RequestOptions,
  tokenOverride?: string | null,
): Promise<Response> => {
  const method = options.method ?? "GET";
  const auth = options.auth ?? true;
  const url = `${API_BASE_URL}${withQuery(endpoint, options.query)}`;

  const token = tokenOverride ?? getStoredToken();
  const headers = new Headers();

  if (auth && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const init: RequestInit = {
    method,
    headers,
    credentials: "include",
    signal: options.signal,
  };

  if (options.body !== undefined && options.body !== null) {
    if (shouldAttachJsonBody(options.body)) {
      headers.set("Content-Type", "application/json");
      init.body = JSON.stringify(options.body);
    } else {
      init.body = options.body as BodyInit;
    }
  }

  const response = await fetch(url, init);

  return response;
};

const parseResponse = async <T>(
  response: Response,
  responseType: ResponseType,
): Promise<T> => {
  if (response.status === 204) {
    return undefined as T;
  }

  if (responseType === "blob") {
    return (await response.blob()) as T;
  }

  if (responseType === "text") {
    return (await response.text()) as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

export const apiRequest = async <T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> => {
  const responseType = options.responseType ?? "json";

  let response = await performRequest<T>(endpoint, options);

  if (
    response.status === 401 &&
    (options.auth ?? true) &&
    endpoint !== "/auth/refresh-token" &&
    endpoint !== "/auth/login" &&
    endpoint !== "/auth/register"
  ) {
    const refreshedToken = await refreshAccessToken();

    if (refreshedToken) {
      response = await performRequest<T>(endpoint, options, refreshedToken);
    }
  }

  if (!response.ok) {
    const errorBody = await parseError(response);

    if (response.status === 401) {
      clearStoredAuth();
    }

    throw new ApiError(
      errorBody.message ?? errorBody.error ?? "Request failed",
      response.status,
      errorBody.details,
    );
  }

  return parseResponse<T>(response, responseType);
};
