"use client";

import * as Toast from "@radix-ui/react-toast";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { cn, createId } from "@/lib/utils";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
};

type ToastContextValue = {
  pushToast: (toast: Omit<ToastItem, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToasts() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToasts must be used within ToastProvider");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const duration = 4200;

  const pushToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const next: ToastItem = { id: createId(), ...toast };
    setToasts((prev) => [...prev, next]);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      <Toast.Provider swipeDirection="down">
        {children}
        <Toast.Viewport className="fixed bottom-6 left-1/2 z-50 flex w-[92%] max-w-sm -translate-x-1/2 flex-col gap-3 outline-none" />
        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            className={cn(
              "glass-panel overflow-hidden rounded-[var(--r-lg)] px-4 py-3 text-sm text-[var(--text-0)] data-[state=open]:animate-[toast-slide-in_220ms_ease-out] data-[state=closed]:animate-[toast-slide-out_180ms_ease-in]",
            )}
            duration={duration}
            onOpenChange={(open) => {
              if (!open) {
                setToasts((prev) => prev.filter((item) => item.id !== toast.id));
              }
            }}
          >
            <Toast.Title className="text-sm font-semibold text-[var(--text-0)]">
              {toast.title}
            </Toast.Title>
            {toast.description ? (
              <Toast.Description className="mt-1 text-xs text-[var(--text-2)]">
                {toast.description}
              </Toast.Description>
            ) : null}
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[var(--glass-2)]">
              <div
                className="h-full rounded-full bg-[var(--acc-0)]"
                style={{ animation: `toastProgress ${duration}ms linear forwards` }}
              />
            </div>
          </Toast.Root>
        ))}
      </Toast.Provider>
    </ToastContext.Provider>
  );
}
