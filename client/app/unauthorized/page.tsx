"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Activity, ShieldAlert } from "lucide-react";

import { getCurrentUser, type AuthRole } from "@/lib/auth";

function dashboardForRole(role?: AuthRole | null) {
  switch (role) {
    case "patient":
      return "/patient";
    case "doctor":
      return "/doctor";
    case "clinic_admin":
      return "/admin";
    case "super_admin":
      return "/superadmin";
    default:
      return "/login";
  }
}

export default function UnauthorizedPage() {
  const [role, setRole] = useState<AuthRole | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      try {
        const response = await getCurrentUser();
        if (isMounted) {
          setRole(response.data?.role ?? null);
        }
      } catch {
        if (isMounted) {
          setRole(null);
        }
      }
    }

    void loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const dashboardHref = useMemo(() => dashboardForRole(role), [role]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_34%),linear-gradient(180deg,#f8fbff_0%,#ffffff_62%)] px-5 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-center justify-center">
        <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-[#020617]">
              <Activity className="size-6 text-white" />
            </div>
            <div className="text-left">
              <p className="text-lg font-semibold text-slate-900">DocPulse</p>
              <p className="text-xs text-slate-500">Access control</p>
            </div>
          </div>

          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <ShieldAlert className="size-6" />
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Access Denied</h1>
          <p className="mt-3 text-sm text-slate-500">You do not have permission to access this page.</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={dashboardHref}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl bg-blue-600 px-4 text-sm font-semibold !text-white transition hover:bg-blue-700 hover:!text-white"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/"
              className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
