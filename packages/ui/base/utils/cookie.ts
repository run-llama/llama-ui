/**
 * Cookie storage adapter for Zustand persistence
 */

import Cookies from "js-cookie";
import type { StateStorage } from "zustand/middleware";

export interface CookieStorage extends StateStorage {
  getItem: (name: string) => string | null;
  setItem: (
    name: string,
    value: string,
    options?: Cookies.CookieAttributes,
  ) => void;
  removeItem: (name: string) => void;
}

/**
 * Creates a cookie storage adapter for Zustand
 */
export function createCookieStorage(
  options: Cookies.CookieAttributes = {},
): CookieStorage {
  const defaultOptions: Cookies.CookieAttributes = {
    expires: 7, // 7 days by default
    path: "/",
    sameSite: "lax",
    ...options,
  };

  return {
    getItem: (name: string) => {
      const value = Cookies.get(name);
      return value ?? null;
    },
    setItem: (
      name: string,
      value: string,
      options?: Cookies.CookieAttributes,
    ) => {
      Cookies.set(name, value, {
        ...defaultOptions,
        ...options,
      });
    },
    removeItem: (name: string) => {
      Cookies.remove(name, { path: defaultOptions.path });
    },
  };
}
