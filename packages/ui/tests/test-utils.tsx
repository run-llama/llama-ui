/**
 * Test utilities for workflows tests
 */

import { type ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { ApiProvider, createMockClients } from "../src/lib";

// Create a wrapper function for renderHook that includes ApiProvider
export function renderHookWithProvider<T>(
  hook: () => T,
  options?: {
    apiClients?: Parameters<typeof ApiProvider>[0]["clients"];
  }
): ReturnType<typeof renderHook<T, any>> {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ApiProvider clients={options?.apiClients || createMockClients()}>
      {children}
    </ApiProvider>
  );

  return renderHook(hook, { wrapper });
}

// Variant that supports hooks receiving props
export function renderHookWithProviderProps<P, T>(
  hook: (props: P) => T,
  options: {
    apiClients?: Parameters<typeof ApiProvider>[0]["clients"];
    initialProps: P;
  }
): ReturnType<typeof renderHook<T, P>> {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ApiProvider clients={options?.apiClients || createMockClients()}>
      {children}
    </ApiProvider>
  );

  return renderHook(hook, { wrapper, initialProps: options.initialProps });
}
