"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { PrimaryButton, SecondaryButton } from "@/components/ui/buttons";
import { useToasts } from "@/components/ui/toasts";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useToasts();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const confirmedMessage = useMemo(() => {
    return searchParams.get("confirmed") ? "Email confirmed. You can sign in." : null;
  }, [searchParams]);

  const signIn = async () => {
    if (!isSupabaseConfigured || !supabase) {
      pushToast({ title: "Supabase not configured" });
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      const message = error.message.toLowerCase().includes("confirm")
        ? "Please confirm your email before signing in."
        : error.message.toLowerCase().includes("invalid login credentials")
          ? "Invalid email or password."
          : error.message;
      setErrorMessage(message);
      pushToast({ title: message });
      return;
    }
    router.push("/today");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 sm:px-10">
      <GlassCard className="glass-panel-strong w-full max-w-[520px]">
        <div className="flex flex-col gap-4">
          <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
            Sign in
          </p>
          {confirmedMessage ? (
            <p className="text-sm text-[var(--text-1)]">{confirmedMessage}</p>
          ) : null}
          {errorMessage ? (
            <p className="text-sm text-[var(--text-1)]">{errorMessage}</p>
          ) : null}
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
  );
}
