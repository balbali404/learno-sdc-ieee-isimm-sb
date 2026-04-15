export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

export const SOCKET_BASE_URL =
  process.env.NEXT_PUBLIC_SOCKET_BASE_URL ?? "http://localhost:4000";

export const FASTAPI_WS_BASE_URL =
  process.env.NEXT_PUBLIC_FASTAPI_WS_BASE_URL ?? "ws://localhost:8000";

export const STORAGE_KEYS = {
  token: "learno_token",
  user: "learno_user",
} as const;
