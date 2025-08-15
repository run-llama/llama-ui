import { create } from "zustand";

export const DEFAULT_CONFIDENCE_THRESHOLD = 0.9;

export interface UIConfigState {
  confidenceThreshold: number;
  setConfidenceThreshold: (value: number) => void;
}

export const useUIConfigStore = create<UIConfigState>((set) => ({
  confidenceThreshold: DEFAULT_CONFIDENCE_THRESHOLD,
  setConfidenceThreshold: (value: number) =>
    set({ confidenceThreshold: value }),
}));
