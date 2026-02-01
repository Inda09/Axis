"use client";

import { ToastProvider } from "@/components/ui/toasts";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
