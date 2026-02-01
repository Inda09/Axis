import type { ReactNode } from "react";
import { DesktopAppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <DesktopAppShell>{children}</DesktopAppShell>
    </AuthGuard>
  );
}
