"use client";

import { create } from "zustand";

type UiState = {
  isGlobalLoading: boolean;
};

type UiActions = {
  setGlobalLoading: (value: boolean) => void;
};

export const useUiStore = create<UiState & UiActions>((set) => ({
  isGlobalLoading: false,
  setGlobalLoading: (value: boolean) => set({ isGlobalLoading: value }),
}));




