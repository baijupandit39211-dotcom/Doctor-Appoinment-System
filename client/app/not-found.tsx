import Link from "next/link";
import { Activity } from "lucide-react";

export default function NotFoundPage() {
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
              <p className="text-xs text-slate-500">Healthcare appointment platform</p>
            </div>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Page Not Found</h1>
          <p className="mt-3 text-sm text-slate-500">The page you are looking for does not exist.</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
            >
              Back to Home
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl bg-blue-600 px-4 text-sm font-semibold !text-white transition hover:bg-blue-700 hover:!text-white"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
