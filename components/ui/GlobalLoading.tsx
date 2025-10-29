"use client";

import { useUiStore } from "@/lib/stores/ui";

export default function GlobalLoading() {
  const isLoading = useUiStore((s) => s.isGlobalLoading);
  if (!isLoading) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/40 border-t-white" />
    </div>
  );
}




