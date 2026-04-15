import { STORAGE_KEYS } from "@/lib/config";
import type { Role } from "@/lib/api/types";

export const AUTH_STORAGE_EVENT = "learno:auth-storage";

export interface StoredUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  schoolId: string | null;
}

const canUseStorage = () => typeof window !== "undefined";

let authStorageNotificationPending = false;

const notifyAuthStorageChange = () => {
  if (!canUseStorage()) {
    return;
  }

  if (authStorageNotificationPending) {
    return;
  }

  authStorageNotificationPending = true;
  queueMicrotask(() => {
    authStorageNotificationPending = false;
    window.dispatchEvent(new Event(AUTH_STORAGE_EVENT));
  });
};

export const getStoredToken = (): string | null => {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(STORAGE_KEYS.token);
};

export const setStoredToken = (token: string | null): void => {
  if (!canUseStorage()) {
    return;
  }

  if (token) {
    window.localStorage.setItem(STORAGE_KEYS.token, token);
    notifyAuthStorageChange();
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.token);
  notifyAuthStorageChange();
};

export const getStoredUser = (): StoredUser | null => {
  if (!canUseStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEYS.user);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: StoredUser | null): void => {
  if (!canUseStorage()) {
    return;
  }

  if (user) {
    window.localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    notifyAuthStorageChange();
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.user);
  notifyAuthStorageChange();
};

export const clearStoredAuth = (): void => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.token);
  window.localStorage.removeItem(STORAGE_KEYS.user);
  notifyAuthStorageChange();
};
