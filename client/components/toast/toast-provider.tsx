"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, CircleAlert, Info, Loader2, TriangleAlert, X } from "lucide-react";

import { TOAST_EVENT_NAME, createToastRecord, type ToastRecord, type ToastVariant } from "@/lib/toast";
import { cn } from "@/lib/utils";

function getToastStyle(variant: ToastVariant) {
  switch (variant) {
    case "success":
      return {
        container: "border-emerald-200 bg-white",
        accent: "bg-emerald-500",
        title: "text-emerald-950",
        message: "text-emerald-900/80",
        icon: CheckCircle2,
        iconClassName: "text-emerald-600",
      };
    case "error":
      return {
        container: "border-rose-200 bg-white",
        accent: "bg-rose-500",
        title: "text-rose-950",
        message: "text-rose-900/80",
        icon: CircleAlert,
        iconClassName: "text-rose-600",
      };
    case "warning":
      return {
        container: "border-amber-200 bg-white",
        accent: "bg-amber-500",
        title: "text-amber-950",
        message: "text-amber-900/80",
        icon: TriangleAlert,
        iconClassName: "text-amber-600",
      };
    case "loading":
      return {
        container: "border-sky-200 bg-white",
        accent: "bg-sky-500",
        title: "text-slate-950",
        message: "text-slate-600",
        icon: Loader2,
        iconClassName: "text-sky-600 animate-spin",
      };
    default:
      return {
        container: "border-sky-200 bg-white",
        accent: "bg-sky-500",
        title: "text-slate-950",
        message: "text-slate-600",
        icon: Info,
        iconClassName: "text-sky-600",
      };
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    function handleToast(event: Event) {
      const detail = (event as CustomEvent<unknown>).detail;
      if (!detail || typeof detail !== "object") {
        return;
      }

      const input = detail as Parameters<typeof createToastRecord>[0];
      if (!input.message?.trim()) {
        return;
      }

      const record = createToastRecord(input);
      setToasts((current) => [record, ...current].slice(0, 4));

      if (record.duration > 0) {
        const timer = window.setTimeout(() => {
          setToasts((current) => current.filter((toast) => toast.id !== record.id));
          timersRef.current.delete(record.id);
        }, record.duration);

        timersRef.current.set(record.id, timer);
      }
    }

    window.addEventListener(TOAST_EVENT_NAME, handleToast);

    return () => {
      window.removeEventListener(TOAST_EVENT_NAME, handleToast);
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  function dismissToast(id: string) {
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  return (
    <>
      {children}

      <div className="pointer-events-none fixed right-4 top-24 z-[200] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3 sm:top-28 lg:top-32">
        {toasts.map((toast) => {
          const style = getToastStyle(toast.variant);
          const Icon = style.icon;

          return (
            <div
              key={toast.id}
              className={cn(
                "pointer-events-auto overflow-hidden rounded-[1.5rem] border bg-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]",
                style.container,
              )}
            >
              <div className={cn("h-1.5 w-full", style.accent)} />
              <div className="flex items-start gap-3 px-4 py-4">
                <div className={cn("mt-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-slate-50", style.iconClassName)}>
                  <Icon className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-sm font-semibold leading-5", style.title)}>{toast.title}</p>
                      <p className={cn("mt-1 text-sm leading-5", style.message)}>{toast.message}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => dismissToast(toast.id)}
                      className="mt-[-2px] grid size-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Dismiss notification"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
