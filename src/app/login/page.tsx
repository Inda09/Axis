"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { PrimaryButton, SecondaryButton } from "@/components/ui/buttons";
import { ToastProvider, useToasts } from "@/components/ui/toasts";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const { pushToast } = useToasts();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    if (!isSupabaseConfigured || !supabase) {
      pushToast({ title: "Supabase not configured" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      pushToast({ title: error.message });
      return;
    }
    router.push("/today");
  };

  return (
    <ToastProvider>
      <div className="flex min-h-screen items-center justify-center px-6">
        <GlassCard className="glass-panel-strong w-full max-w-md">
          <div className="flex flex-col gap-4">
            <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
              Sign in
            </p>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              type="email"
              className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--glass)] px-3 py-3 text-sm text-[var(--text-0)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--acc-0)]"
            />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              type="password"
              className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--glass)] px-3 py-3 text-sm text-[var(--text-0)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--acc-0)]"
            />
            <PrimaryButton type="button" onClick={signIn} disabled={loading}>
              {loading ? "Signing in" : "Sign in"}
            </PrimaryButton>
            <Link href="/signup">
              <SecondaryButton type="button">Create account</SecondaryButton>
            </Link>
          </div>
        </GlassCard>
      </div>
    </ToastProvider>
  );
}
