export type ToastVariant = "success" | "error" | "info" | "warning" | "loading";

export type ToastInput = {
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
};

export type ToastRecord = Required<Pick<ToastInput, "message">> & {
  id: string;
  title: string;
  variant: ToastVariant;
  duration: number;
};

export const TOAST_EVENT_NAME = "docpulse:toast";

export function emitToast(input: ToastInput) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<ToastInput>(TOAST_EVENT_NAME, {
      detail: input,
    }),
  );
}

export function createToastRecord(input: ToastInput): ToastRecord {
  const variant = input.variant ?? "info";
  const duration = input.duration ?? getDefaultToastDuration(variant);
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: input.title?.trim() || variant.charAt(0).toUpperCase() + variant.slice(1),
    message: input.message,
    variant,
    duration,
  };
}

function getDefaultToastDuration(variant: ToastVariant) {
  switch (variant) {
    case "success":
    case "info":
      return 3000;
    case "warning":
      return 4000;
    case "error":
      return 5000;
    case "loading":
      return 0;
    default:
      return 3000;
  }
}
