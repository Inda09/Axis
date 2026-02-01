"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { PrimaryButton, SecondaryButton } from "@/components/ui/buttons";
import { ToastProvider, useToasts } from "@/components/ui/toasts";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      pushToast({ title: error.message });
      return;
    }
    if (data.session) {
      router.push("/today");
    } else {
      setNeedsConfirmation(true);
    }
  };

  return (
    <ToastProvider>
      <div className="flex min-h-screen items-center justify-center px-6">
        <GlassCard className="glass-panel-strong w-full max-w-md">
          <div className="flex flex-col gap-4">
            <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
              Create account
            </p>
            {needsConfirmation ? (
              <p className="text-sm text-[var(--text-1)]">
                Check your email to confirm your account.
              </p>
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
    </ToastProvider>
  );
}
