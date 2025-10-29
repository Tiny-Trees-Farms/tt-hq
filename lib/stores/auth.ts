"use client";

import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthState = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
};

type AuthActions = {
  init: () => void;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  session: null,
  isLoading: false,
  error: null,

  init: () => {
    const supabase = getSupabaseBrowserClient();
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user ?? null });
    });
    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
    });
  },

  clearError: () => set({ error: null }),

  signInWithPassword: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) set({ error: error.message });
    set({ isLoading: false });
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();
    if (error) set({ error: error.message });
    set({ isLoading: false });
  },
}));




