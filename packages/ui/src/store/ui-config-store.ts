import { create } from "zustand";

export const DEFAULT_CONFIDENCE_THRESHOLD = 0.9;

export interface UIConfigState {
  confidenceThreshold: number;
  setConfidenceThreshold: (value: number) => void;
}

export const createUIConfigStore = () =>
  create<UIConfigState>((set) => ({
    confidenceThreshold: DEFAULT_CONFIDENCE_THRESHOLD,
    setConfidenceThreshold: (value: number) =>
      set({ confidenceThreshold: value }),
  }));

let globalUIConfigStore: ReturnType<typeof createUIConfigStore> | null = null;

export function useUIConfigStore(): UIConfigState;
export function useUIConfigStore<T>(selector: (state: UIConfigState) => T): T;

export function useUIConfigStore<T>(selector?: (state: UIConfigState) => T) {
  if (!globalUIConfigStore) {
    globalUIConfigStore = createUIConfigStore();
  }

  return selector ? globalUIConfigStore(selector) : globalUIConfigStore();
}
