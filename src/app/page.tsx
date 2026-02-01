"use client";

import Link from "next/link";
import { LandingHeroRing } from "@/components/landing/LandingHeroRing";
import { GlassCard } from "@/components/ui/glass-card";
import { PrimaryButton, SecondaryButton, IconButton } from "@/components/ui/buttons";
import { useSession } from "@/lib/auth/useSession";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/constants";

export default function LandingPage() {
  const { session, user } = useSession();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[900px] flex-col px-6 pb-16 pt-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-[var(--acc-0)] shadow-[var(--glow)]" />
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--text-0)]">
            {APP_NAME}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <Link href="/today">
                <PrimaryButton className="w-auto px-4 py-2 text-[0.6rem]">
                  Open Axis
                </PrimaryButton>
              </Link>
              <IconButton
                type="button"
                aria-label="Sign out"
                onClick={() => supabase?.auth.signOut()}
                disabled={!isSupabaseConfigured}
              >
                {user?.email?.charAt(0).toUpperCase() ?? "U"}
              </IconButton>
            </>
          ) : (
            <Link href="/login">
              <SecondaryButton className="w-auto px-4 py-2 text-[0.6rem]">
                Sign in
              </SecondaryButton>
            </Link>
          )}
        </div>
      </header>

      <main className="mt-14 flex flex-col items-center gap-10 text-center">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-4xl font-semibold text-[var(--text-0)] sm:text-5xl">
            Axis
          </h1>
          <p className="text-sm uppercase tracking-[0.35em] text-[var(--text-2)]">
            Time regulation for focus, breaks, and recovery.
          </p>
        </div>

        <GlassCard className="glass-panel-strong flex w-full max-w-lg flex-col items-center gap-6 py-8">
          <LandingHeroRing />
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <Link href={session ? "/today" : "/login"} className="w-full">
              <PrimaryButton type="button">Open Axis</PrimaryButton>
            </Link>
            <Link href="/signup" className="w-full">
              <SecondaryButton type="button">Create account</SecondaryButton>
            </Link>
          </div>
        </GlassCard>
      </main>
    </div>
  );
}
