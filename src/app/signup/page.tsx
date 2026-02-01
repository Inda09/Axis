"use client";

import Link from "next/link";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { PrimaryButton, SecondaryButton } from "@/components/ui/buttons";
import { useToasts } from "@/components/ui/toasts";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export default function SignupPage() {
  const { pushToast } = useToasts();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const signUp = async () => {
    if (!isSupabaseConfigured || !supabase) {
      pushToast({ title: "Supabase not configured" });
      return;
    }
    setLoading(true);
    const emailRedirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/login?confirmed=true`
        : undefined;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: emailRedirectTo ? { emailRedirectTo } : undefined,
    });
    setLoading(false);
    if (error) {
      pushToast({ title: error.message });
      return;
    }
    if (data.session) {
      await supabase.auth.signOut();
    }
    setNeedsConfirmation(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 sm:px-10">
      <GlassCard className="glass-panel-strong w-full max-w-[520px]">
        <div className="flex flex-col gap-4">
          <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
            Create account
          </p>
          {needsConfirmation ? (
            <div className="flex flex-col gap-2 text-sm text-[var(--text-1)]">
              <p>Check your email to confirm your account.</p>
              <p className="text-[0.7rem] uppercase tracking-[0.28em] text-[var(--text-2)]">
                You can sign in after confirmation.
              </p>
            </div>
          ) : (
            <>
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
              <PrimaryButton type="button" onClick={signUp} disabled={loading}>
                {loading ? "Creating" : "Create account"}
              </PrimaryButton>
            </>
          )}
          <Link href="/login">
            <SecondaryButton type="button">Back to sign in</SecondaryButton>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
