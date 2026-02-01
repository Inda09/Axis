"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/useSession";
import { GlassCard } from "@/components/ui/glass-card";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, loading } = useSession();

  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <GlassCard className="glass-panel-strong flex flex-col gap-3 px-8 py-6 text-center">
          <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
            Supabase not configured
          </p>
          <p className="text-sm text-[var(--text-1)]">
            Run <span className="text-[var(--text-0)]">npm run setup:supabase</span>{" "}
            and restart the dev server.
          </p>
        </GlassCard>
      </div>
    );
  }

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, session, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <GlassCard className="glass-panel-strong flex flex-col items-center gap-3 px-8 py-6">
          <div className="h-10 w-10 rounded-full border border-[var(--border-2)] border-t-transparent animate-spin" />
          <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[var(--text-2)]">
            Loading
          </p>
        </GlassCard>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
