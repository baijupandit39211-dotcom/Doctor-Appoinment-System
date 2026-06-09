"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ShieldCheck, Stethoscope } from "lucide-react";

import { NotificationBell } from "../notifications/notification-bell";

type DashboardStat = {
  label: string;
  value: string;
  detail: string;
};

type DashboardAction = {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
};

type DashboardNavItem = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
};

type DashboardStatusChip = {
  label: string;
  value: string;
  className: string;
};

type DashboardUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type DashboardShellProps = {
  roleLabel: string;
  title: string;
  subtitle: string;
  accent: string;
  navItems: DashboardNavItem[];
  stats: DashboardStat[];
  actions: DashboardAction[];
  activeNavLabel?: string;
  statusChips?: DashboardStatusChip[];
  onNavItemSelect?: (label: string) => void;
  highlights: string[];
  nextSteps: string[];
  user?: DashboardUser | null;
  onLogout?: () => void | Promise<void>;
  isLoggingOut?: boolean;
  children?: ReactNode;
};

export function DashboardShell({
  roleLabel,
  navItems,
  activeNavLabel,
  onNavItemSelect,
  user,
  onLogout,
  isLoggingOut,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <main className="bg-slate-50 text-slate-900">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="flex border-b border-slate-200 bg-white px-5 py-5 lg:sticky lg:top-0 lg:self-start lg:flex-col lg:border-b-0 lg:border-r lg:px-0 lg:py-0">
          <div className="flex flex-1 flex-col">
            <div className="px-3 sm:px-5 lg:px-6 lg:pt-6">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-2xl bg-[#020617] text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)]">
                  <Stethoscope className="size-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold tracking-tight">DocPulse</p>
                  <p className="text-xs text-slate-500">{roleLabel}</p>
                </div>
              </div>

              <nav className="mt-8 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isPathActive = item.href ? pathname === item.href : false;
                  const isActive = (activeNavLabel ?? navItems[0]?.label) === item.label || isPathActive;
                  const itemClassName = `flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-normal no-underline transition ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-cyan-500 !text-white font-semibold shadow-[0_12px_28px_rgba(2,6,23,0.16)]"
                      : "!text-slate-600 hover:bg-slate-100 hover:!text-slate-900"
                  }`;

                  if (item.href) {
                    return (
                      <Link key={item.label} href={item.href} aria-current={isActive ? "page" : undefined} className={itemClassName}>
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  }

                  return (
                    <button
                      type="button"
                      key={item.label}
                      onClick={() => onNavItemSelect?.(item.label)}
                      aria-current={isActive ? "page" : undefined}
                      className={itemClassName}
                    >
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="mt-auto hidden border-t border-slate-200 px-3 py-4 lg:block lg:px-6 lg:py-6">
              {user ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Logged in</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{user.name}</p>
                  <p className="mt-1 break-all text-xs text-slate-500">{user.email}</p>
                  <p className="mt-2 inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                    {user.role}
                  </p>
                  {onLogout ? (
                    <button
                      type="button"
                      onClick={onLogout}
                      disabled={isLoggingOut}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isLoggingOut ? "Logging out..." : "Logout"}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur-sm sm:px-8 lg:px-10">
            <div className="flex items-center justify-end gap-4">
              <NotificationBell user={user} />
            </div>
          </div>
          {children ? <div className="min-w-0">{children}</div> : null}
        </section>
      </div>
    </main>
  );
}
