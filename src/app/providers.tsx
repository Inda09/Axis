"use client";

import { ToastProvider } from "@/components/ui/toasts";
import { AxisStoreProvider } from "@/lib/store";
import { NotificationManager } from "@/components/notification-manager";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AxisStoreProvider>
      <NotificationManager />
      <ToastProvider>{children}</ToastProvider>
    </AxisStoreProvider>
  );
}
