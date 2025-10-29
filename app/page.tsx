"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { z } from "zod";
import { useAuthStore } from "@/lib/stores/auth";
import { useUiStore } from "@/lib/stores/ui";

const LoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();
  const signInWithPassword = useAuthStore((s) => s.signInWithPassword);
  const authError = useAuthStore((s) => s.error);
  const clearAuthError = useAuthStore((s) => s.clearError);
  const setGlobalLoading = useUiStore((s) => s.setGlobalLoading);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const parsed = LoginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const errors: { email?: string; password?: string } = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0] as "email" | "password";
        errors[key] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    clearAuthError();
    setGlobalLoading(true);
    await signInWithPassword(email, password);
    setGlobalLoading(false);

    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      router.replace("/dashboard");
    } else if (authError) {
      setFormError(authError);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
        <Image src="/TT_logo.png" alt="logo" width={115} height={115} className="mb-4 mx-auto" />
        <h1 className="text-4xl font-semibold mb-8 text-center">TINY TREES HQ</h1>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {fieldErrors.email && (
          <p className="text-red-400 text-sm" role="alert">{fieldErrors.email}</p>
        )}
        {fieldErrors.password && (
          <p className="text-red-400 text-sm" role="alert">{fieldErrors.password}</p>
        )}
        {formError && (
          <p className="text-red-400 text-sm" role="alert">{formError}</p>
        )}
        <Button type="submit" className="w-full">Login</Button>
      </form>
    </div>
  );
}
