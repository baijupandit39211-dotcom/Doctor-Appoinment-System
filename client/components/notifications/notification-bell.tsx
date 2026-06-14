"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, CheckCheck, Clock3, Loader2, MoreHorizontal, Trash2, X } from "lucide-react";

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
  link?: string;
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

function getNotificationTypeLabel(type?: string) {
  const normalizedType = type?.trim().replace(/[_-]+/g, " ").trim();
  if (!normalizedType) {
    return "Update";
  }

  return normalizedType
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getNotificationTypeClassName(type?: string) {
  const normalizedType = type?.trim().toLowerCase();

  switch (normalizedType) {
    case "appointment":
    case "appointments":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "approval":
    case "doctor_approval":
    case "doctor approval":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "system":
    case "info":
      return "border-slate-200 bg-slate-50 text-slate-700";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "urgent":
    case "alert":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
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
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [openNotificationMenuId, setOpenNotificationMenuId] = useState<string | null>(null);
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
      setOpenNotificationMenuId(null);
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
        setOpenNotificationMenuId(null);
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

  function resolveNotificationHref(notification: NotificationRecord) {
    if (notification.link?.trim()) {
      return notification.link.trim();
    }

    const title = notification.title.trim().toLowerCase();
    const message = notification.message.trim().toLowerCase();
    const isDoctorReviewAlert =
      title.includes("doctor profile update pending review") ||
      title.includes("profile update pending review") ||
      message.includes("doctor profile update is waiting for approval");

    if (isDoctorReviewAlert && (user?.role === "super_admin" || user?.role === "clinic_admin")) {
      return `${user.role === "super_admin" ? "/superadmin" : "/admin"}?section=Doctor%20Approvals`;
    }

    return "";
  }

  async function openNotification(notification: NotificationRecord) {
    const href = resolveNotificationHref(notification);
    if (!href) {
      return;
    }

    if (!notification.isRead) {
      try {
        await requestJson(`/api/notifications/${notification._id}/read`, { method: "PATCH" });
        setNotifications((current) =>
          current.map((item) => (item._id === notification._id ? { ...item, isRead: true } : item)),
        );
        setUnreadCount((current) => Math.max(current - 1, 0));
      } catch {
        // Continue to navigate even if the read update fails.
      }
    }

    setIsOpen(false);
    setOpenNotificationMenuId(null);
    router.push(href);
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

  async function deleteReadNotifications() {
    const readNotifications = notifications.filter((notification) => notification.isRead);
    if (readNotifications.length === 0) {
      return;
    }

    setIsMarkingAll(true);
    setError("");

    try {
      await Promise.all(readNotifications.map((notification) => requestJson(`/api/notifications/${notification._id}`, { method: "DELETE" })));
      setNotifications((current) => current.filter((notification) => !notification.isRead));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete notifications");
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
          onClick={() =>
            setIsOpen((current) => {
              const next = !current;
              if (!next) {
                setOpenNotificationMenuId(null);
              }
              return next;
            })
          }
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
          <div className="absolute right-0 top-14 z-50 w-[min(24rem,calc(100vw-1rem))] rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.15)]">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-950">Notifications</p>
                <p className="mt-1 text-xs text-slate-500">Live alerts and updates</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={markAllAsRead}
                  disabled={isMarkingAll || unreadCount === 0}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium leading-none text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isMarkingAll ? "Updating..." : "Mark all as read"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenNotificationMenuId(null);
                    setIsOpen(false);
                  }}
                  className="grid size-8 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                  aria-label="Close notifications"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="mt-5">
              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
              ) : null}

              {isLoading ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-8 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin text-slate-500" />
                  <p className="mt-3 text-sm text-slate-600">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">No notifications</p>
                  <p className="mt-2 text-sm text-slate-600">Recent alerts will show here.</p>
                </div>
              ) : (
                <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                  {notifications.slice(0, 8).map((notification) => {
                    const isUnread = !notification.isRead;
                    const isMenuOpen = openNotificationMenuId === notification._id;
                    const href = resolveNotificationHref(notification);

                    return (
                      <article
                        key={notification._id}
                        role={href ? "button" : undefined}
                        tabIndex={href ? 0 : undefined}
                        onClick={href ? () => void openNotification(notification) : undefined}
                        onKeyDown={
                          href
                            ? (event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  void openNotification(notification);
                                }
                              }
                            : undefined
                        }
                        className={`relative rounded-3xl border px-3.5 py-3 transition sm:px-4 sm:py-4 ${
                          href ? "cursor-pointer hover:border-blue-200 hover:bg-blue-50/80" : ""
                        } ${isUnread ? "border-blue-100 bg-blue-50/70" : "border-slate-200 bg-white"}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1 flex shrink-0 items-center gap-2">
                            {isUnread ? <span className="size-2 rounded-full bg-blue-600" /> : <span className="size-2 rounded-full bg-slate-300" />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="truncate text-sm font-semibold text-slate-950">{notification.title}</p>
                                  <span className="whitespace-nowrap text-xs font-medium text-slate-400">
                                    {formatRelativeTime(notification.createdAt)}
                                  </span>
                                </div>
                                <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">
                                  {notification.message}
                                </p>
                              </div>

                              <div className="relative shrink-0">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setOpenNotificationMenuId((current) =>
                                      current === notification._id ? null : notification._id,
                                    );
                                  }}
                                  className="grid size-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                  aria-label="Notification actions"
                                  aria-haspopup="menu"
                                  aria-expanded={isMenuOpen}
                                >
                                  <MoreHorizontal className="size-4" />
                                </button>

                                {isMenuOpen ? (
                                  <div className="absolute right-0 top-9 z-10 w-36 rounded-2xl border border-slate-200 bg-white p-1 shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
                                    {!notification.isRead ? (
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          setOpenNotificationMenuId(null);
                                          markAsRead(notification._id);
                                        }}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                                      >
                                        <CheckCheck className="size-4" />
                                        Mark read
                                      </button>
                                    ) : null}
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setOpenNotificationMenuId(null);
                                        deleteNotification(notification._id);
                                      }}
                                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-700 transition hover:bg-rose-50"
                                    >
                                      <Trash2 className="size-4" />
                                      Delete
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                              <Clock3 className="size-3.5" />
                              <span>{formatRelativeTime(notification.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
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
