"use client";

import { create } from "zustand";

export type DashboardSection = "orders" | "menu" | "support" | "drivers";

type NavState = {
  activeSection: DashboardSection;
};

type NavActions = {
  setActiveSection: (section: DashboardSection) => void;
};

export const useNavStore = create<NavState & NavActions>((set) => ({
  activeSection: "orders",
  setActiveSection: (section: DashboardSection) => set({ activeSection: section }),
}));


