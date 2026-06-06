"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Nav as LandingNavbar } from "@/components/landing/landing";
import { registerUser, type AuthRole } from "@/lib/auth";

function redirectForRole(role: AuthRole) {
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
      return "/";
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<AuthRole>("patient");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await registerUser({ name, email, password, role });
      const nextRole = response.data?.role;
      router.push(nextRole ? redirectForRole(nextRole) : "/");
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_34%),linear-gradient(180deg,#f8fbff_0%,#ffffff_62%)] text-slate-900">
      <LandingNavbar />

      <main className="px-5 pb-10 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-7xl items-start justify-center">
          <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="mb-6 space-y-2 text-center">
              <h1 className="text-3xl font-semibold tracking-tight">Create account</h1>
              <p className="text-sm text-slate-500">Join DocPulse and get started.</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                  placeholder="Jane Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 py-3 pl-4 pr-12 outline-none transition focus:border-blue-500"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-500 transition hover:text-slate-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium">
                  Role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(event) => setRole(event.target.value as AuthRole)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="clinic_admin">Clinic admin</option>
                  <option value="super_admin">Super admin</option>
                </select>
              </div>

              {error ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold !text-white transition hover:bg-blue-700 hover:!text-white disabled:cursor-not-allowed disabled:opacity-70"
                style={{ color: "#ffffff" }}
              >
                {isLoading ? "Creating account..." : "Create account"}
              </button>

              <p className="text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-blue-600 hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
