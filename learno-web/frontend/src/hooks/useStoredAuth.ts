'use client';

import { useSyncExternalStore } from 'react';
import {
  AUTH_STORAGE_EVENT,
  getStoredToken,
  getStoredUser,
  type StoredUser,
} from '@/lib/auth/storage';

interface StoredAuthState {
  token: string | null;
  user: StoredUser | null;
  isHydrated: boolean;
}

export function useStoredAuth(): StoredAuthState {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}

const serverSnapshot: StoredAuthState = {
  token: null,
  user: null,
  isHydrated: false,
};

let cachedClientSnapshot: StoredAuthState = {
  token: null,
  user: null,
  isHydrated: true,
};
let cachedClientKey = 'null';

function getServerSnapshot(): StoredAuthState {
  return serverSnapshot;
}

function getClientSnapshot(): StoredAuthState {
  const token = getStoredToken();
  const user = getStoredUser();
  const key = JSON.stringify({ token, user });

  if (key === cachedClientKey) {
    return cachedClientSnapshot;
  }

  cachedClientKey = key;
  cachedClientSnapshot = {
    token,
    user,
    isHydrated: true,
  };

  return cachedClientSnapshot;
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleChange = () => {
    onStoreChange();
  };

  window.addEventListener('storage', handleChange);
  window.addEventListener(AUTH_STORAGE_EVENT, handleChange);

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener(AUTH_STORAGE_EVENT, handleChange);
  };
}
