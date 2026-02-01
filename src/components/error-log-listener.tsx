"use client";

import { useEffect } from "react";
import { appendErrorLog } from "@/lib/error-log";
import { createId } from "@/lib/utils";

export function ErrorLogListener() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      appendErrorLog({
        id: createId(),
        message: event.message,
        source: event.filename,
        stack: event.error?.stack,
        time: new Date().toISOString(),
      });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason =
        typeof event.reason === "string"
          ? event.reason
          : event.reason?.message ?? "Unhandled promise rejection";
      appendErrorLog({
        id: createId(),
        message: reason,
        stack: event.reason?.stack,
        time: new Date().toISOString(),
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
