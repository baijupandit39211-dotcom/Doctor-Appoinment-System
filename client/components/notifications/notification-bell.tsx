"use client";

import { useEffect, useRef, useState } from "react";
import { BellRing, CheckCheck, Loader2, Trash2, X } from "lucide-react";

import { requestJson } from "@/lib/api-client";
import { disconnectNotificationSocket, getNotificationSocket } from "@/lib/socket";

type DashboardUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type NotificationRecord = {
  _id: string;
  title: string;
  message: string;
  type?: string;
  isRead?: boolean;
  createdAt?: string;
};

type ToastRecord = {
  id: string;
  title: string;
  message: string;
};

type NotificationResponse = {
  unreadCount?: number;
  data?: NotificationRecord[];
};

function sortNotifications(notifications: NotificationRecord[]) {
  return [...notifications].sort((left, right) => {
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightTime - leftTime;
  });
}

function formatRelativeTime(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(Math.floor(diffMs / 60000), 0);

  if (diffMinutes < 1) {
    return "Just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

async function playNotificationTone() {
  try {
    const audio = new Audio("/sounds/notification.mp3");
    audio.volume = 0.35;
    await audio.play();
    return;
  } catch {
    // Fallback below.
  }

  try {
    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.value = 0.0001;

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();

    gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.35);
    oscillator.stop(context.currentTime + 0.38);
    oscillator.onended = () => {
      void context.close().catch(() => undefined);
    };
  } catch {
    // Fail silently.
  }
}

export function NotificationBell({ user }: { user: DashboardUser | null | undefined }) {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [busyNotificationId, setBusyNotificationId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const toastTimersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setError("");
      setIsOpen(false);
      return;
    }

    let active = true;

    async function loadNotifications() {
      setIsLoading(true);
      setError("");

      try {
        const response = await requestJson<NotificationRecord[]>("/api/notifications/me");

        if (!active) {
          return;
        }

        setNotifications(sortNotifications(response.data ?? []));
        setUnreadCount(response.unreadCount ?? 0);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load notifications");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadNotifications();

    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const socket = getNotificationSocket();

    const handleNewNotification = (notification: NotificationRecord) => {
      setNotifications((current) => sortNotifications([notification, ...current.filter((item) => item._id !== notification._id)]));
      setUnreadCount((current) => current + (notification.isRead ? 0 : 1));
      pushToast(notification.title, notification.message);
      void playNotificationTone();
    };

    const handleSync = (payload: { unreadCount?: number; action?: "read" | "delete" | "read-all"; notificationId?: string }) => {
      if (typeof payload.unreadCount === "number") {
        setUnreadCount(payload.unreadCount);
      }

      if (payload.action === "read-all") {
        setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
      }

      if (payload.action === "read" && payload.notificationId) {
        setNotifications((current) =>
          current.map((notification) =>
            notification._id === payload.notificationId ? { ...notification, isRead: true } : notification,
          ),
        );
      }

      if (payload.action === "delete" && payload.notificationId) {
        setNotifications((current) => current.filter((notification) => notification._id !== payload.notificationId));
      }
    };

    socket.on("notification:new", handleNewNotification);
    socket.on("notification:sync", handleSync);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.off("notification:sync", handleSync);
      socket.disconnect();
      disconnectNotificationSocket();
    };
  }, [user?.id]);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, []);

  useEffect(() => {
    return () => {
      toastTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      toastTimersRef.current.clear();
    };
  }, []);

  function pushToast(title: string, message: string) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((current) => [{ id, title, message }, ...current].slice(0, 3));

    const timer = window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
      toastTimersRef.current.delete(id);
    }, 4000);

    toastTimersRef.current.set(id, timer);
  }

  async function markAsRead(notificationId: string) {
    setBusyNotificationId(notificationId);
    setError("");
    try {
      await requestJson(`/api/notifications/${notificationId}/read`, { method: "PATCH" });
      setNotifications((current) =>
        current.map((notification) =>
          notification._id === notificationId ? { ...notification, isRead: true } : notification,
        ),
      );
      setUnreadCount((current) => Math.max(current - 1, 0));
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : "Failed to update notification");
    } finally {
      setBusyNotificationId(null);
    }
  }

  async function markAllAsRead() {
    setIsMarkingAll(true);
    setError("");
    try {
      await requestJson("/api/notifications/read-all", { method: "PATCH" });
      setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
      setUnreadCount(0);
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : "Failed to update notifications");
    } finally {
      setIsMarkingAll(false);
    }
  }

  async function deleteNotification(notificationId: string) {
    setBusyNotificationId(notificationId);
    setError("");
    try {
      const notification = notifications.find((item) => item._id === notificationId);
      await requestJson(`/api/notifications/${notificationId}`, { method: "DELETE" });
      setNotifications((current) => current.filter((item) => item._id !== notificationId));
      if (notification && !notification.isRead) {
        setUnreadCount((current) => Math.max(current - 1, 0));
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete notification");
    } finally {
      setBusyNotificationId(null);
    }
  }

  return (
    <>
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="relative grid size-11 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:bg-slate-50"
          aria-label="Notifications"
          aria-expanded={isOpen}
        >
          <BellRing className="size-5" />
          {unreadCount > 0 ? (
            <span className="absolute right-2 top-2 min-w-4 rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-4 text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>

        {isOpen ? (
          <div className="absolute right-0 top-14 z-50 w-[min(22rem,calc(100vw-1rem))] rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.15)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">Notifications</p>
                <p className="mt-1 text-xs text-slate-500">Live updates from appointments and approvals.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={markAllAsRead}
                  disabled={isMarkingAll || unreadCount === 0}
                  className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isMarkingAll ? "Updating..." : "Mark all as read"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="grid size-8 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                  aria-label="Close notifications"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="mt-4">
              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
              ) : null}

              {isLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin text-slate-500" />
                  <p className="mt-3 text-sm text-slate-600">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">No notifications</p>
                  <p className="mt-2 text-sm text-slate-600">Recent alerts will show here.</p>
                </div>
              ) : (
                <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                  {notifications.slice(0, 8).map((notification) => (
                    <article
                      key={notification._id}
                      className={`rounded-2xl border p-3 transition ${
                        notification.isRead ? "border-slate-200 bg-white" : "border-blue-100 bg-blue-50/70"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {!notification.isRead ? <span className="size-2 rounded-full bg-blue-600" /> : null}
                            <p className="truncate text-sm font-semibold text-slate-950">{notification.title}</p>
                          </div>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{notification.message}</p>
                          <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {!notification.isRead ? (
                          <button
                            type="button"
                            onClick={() => markAsRead(notification._id)}
                            disabled={busyNotificationId === notification._id}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <CheckCheck className="size-3.5" />
                            {busyNotificationId === notification._id ? "Updating..." : "Mark read"}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => deleteNotification(notification._id)}
                          disabled={busyNotificationId === notification._id}
                          className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="size-3.5" />
                          {busyNotificationId === notification._id ? "Updating..." : "Delete"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="pointer-events-none fixed right-4 top-4 z-[80] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.18)]"
          >
            <p className="text-sm font-semibold text-slate-950">{toast.title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{toast.message}</p>
          </div>
        ))}
      </div>
    </>
  );
}
