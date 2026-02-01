"use client";

import Link from "next/link";
import { LandingHeroRing } from "@/components/landing/LandingHeroRing";
import { GlassCard } from "@/components/ui/glass-card";
import { PrimaryButton, SecondaryButton } from "@/components/ui/buttons";
import { APP_NAME } from "@/lib/constants";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="w-full">
        <div className="mx-auto flex w-full max-w-screen-xl items-center justify-between px-6 pt-8 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-[var(--acc-0)] shadow-[var(--glow)]" />
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--text-0)]">
              {APP_NAME}
            </p>
          </div>
          <Link href="/login">
            <SecondaryButton className="w-auto px-4 py-2 text-[0.6rem]">
              Sign in
            </SecondaryButton>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-screen-xl flex-1 flex-col items-center justify-center gap-12 px-6 pb-16 pt-10 text-center sm:px-8">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-4xl font-semibold text-[var(--text-0)] sm:text-5xl lg:text-6xl">
            Axis
          </h1>
          <p className="text-xs uppercase tracking-[0.4em] text-[var(--text-2)] sm:text-sm lg:text-base">
            Time regulation for focus, breaks, and recovery.
          </p>
        </div>

        <GlassCard className="glass-panel-strong flex w-full max-w-xl flex-col items-center gap-8 py-10 lg:max-w-2xl">
          <div className="flex items-center justify-center">
            <div className="scale-90 sm:scale-100 lg:scale-[1.1] xl:scale-[1.2]">
              <LandingHeroRing />
            </div>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <Link href="/today" className="w-full">
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
