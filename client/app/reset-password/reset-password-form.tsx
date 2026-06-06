"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Activity } from "lucide-react";

import { resetPassword } from "@/lib/auth";

type ResetPasswordFormProps = {
  token: string;
};

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatusMessage("");

    if (!token) {
      setError("Reset token is missing");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await resetPassword({ token, password });
      setStatusMessage(response.message);
      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_34%),linear-gradient(180deg,#f8fbff_0%,#ffffff_62%)] px-5 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-center justify-center">
        <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-[#020617]">
              <Activity className="size-6 text-white" />
            </div>
            <div className="text-left">
              <p className="text-lg font-semibold text-slate-900">DocPulse</p>
              <p className="text-xs text-slate-500">Set a new password</p>
            </div>
          </div>

          <div className="mb-6 space-y-2 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">Reset password</h1>
            <p className="text-sm text-slate-500">Choose a new password for your DocPulse account.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                New password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                placeholder="Create a new password"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                placeholder="Repeat your new password"
                required
              />
            </div>

            {!token ? (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Reset token is missing. Open the link from your reset email or console output.
              </p>
            ) : null}

            {error ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            ) : null}

            {statusMessage ? (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {statusMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isLoading || !token}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold !text-white transition hover:bg-blue-700 hover:!text-white disabled:cursor-not-allowed disabled:opacity-70"
              style={{ color: "#ffffff" }}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>

            <p className="text-center text-sm text-slate-500">
              Back to{" "}
              <Link href="/login" className="font-medium text-blue-600 hover:underline">
                login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
