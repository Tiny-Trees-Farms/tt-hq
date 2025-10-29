"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth";

export default function AuthInit() {
  const init = useAuthStore((s) => s.init);
  useEffect(() => {
    init();
  }, [init]);
  return null;
}




