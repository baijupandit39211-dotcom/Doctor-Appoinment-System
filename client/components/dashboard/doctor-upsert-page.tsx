"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DashboardShell } from "./dashboard-shell";
import { getCurrentUser, logoutUser, type AuthRole, type AuthUser } from "@/lib/auth";
import { requestJson } from "@/lib/api-client";

type DashboardNavItem = {
  label: string;
  icon: LucideIcon;
};

type DashboardSectionKey = "Overview" | "Doctors" | "Departments" | "Appointments" | "Reports";

type DoctorUpsertMode = "create" | "edit";

type DoctorUpsertPageProps = {
  expectedRole: "clinic_admin" | "super_admin";
  roleLabel: string;
  accent: string;
  title: string;
  subtitle: string;
  navItems: DashboardNavItem[];
  basePath: "/admin" | "/superadmin";
  mode: DoctorUpsertMode;
  doctorId?: string;
};

type DoctorDepartmentRef = {
  _id?: string;
  name?: string;
};

type DoctorUserRef = {
  _id?: string;
  name?: string;
  email?: string;
};

type DoctorRecord = {
  _id?: string;
  userId?: DoctorUserRef | string;
  departmentId?: DoctorDepartmentRef | string;
  specialization?: string;
  experienceYears?: number;
  consultationFee?: number;
  bio?: string;
  profileStatus?: "pending" | "approved" | "rejected" | string;
  isPublic?: boolean;
  isAvailable?: boolean;
};

type DepartmentRecord = {
  _id?: string;
  name?: string;
};

type DoctorFormState = {
  name: string;
  email: string;
  password: string;
  departmentId: string;
  specialization: string;
  experienceYears: string;
  consultationFee: string;
  bio: string;
  status: "pending" | "active";
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

const rolePathMap: Record<AuthRole, string> = {
  patient: "/patient",
  doctor: "/doctor",
  clinic_admin: "/admin",
  super_admin: "/superadmin",
};

function getDoctorDepartmentId(ref?: DoctorRecord["departmentId"]) {
  if (!ref) {
    return "";
  }

  if (typeof ref === "string") {
    return ref;
  }

  return ref._id ?? "";
}

function getDoctorUserName(user?: DoctorRecord["userId"]) {
  if (!user) {
    return "";
  }

  if (typeof user === "string") {
    return "";
  }

  return user.name ?? "";
}

function getDoctorUserEmail(user?: DoctorRecord["userId"]) {
  if (!user || typeof user === "string") {
    return "";
  }

  return user.email ?? "";
}

function getDoctorBasePath(role?: AuthRole) {
  return role === "super_admin" ? "/superadmin" : "/admin";
}

function buildReturnHref(basePath: "/admin" | "/superadmin") {
  return `${basePath}?section=Doctors`;
}

function buildDoctorSectionHref(basePath: "/admin" | "/superadmin", mode: DoctorUpsertMode, doctorId?: string) {
  if (mode === "edit" && doctorId) {
    return `${basePath}/doctors/${doctorId}/edit`;
  }

  return `${basePath}/doctors/new`;
}

function buildDoctorFormState(doctor?: DoctorRecord | null): DoctorFormState {
  return {
    name: getDoctorUserName(doctor?.userId),
    email: getDoctorUserEmail(doctor?.userId),
    password: "",
    departmentId: getDoctorDepartmentId(doctor?.departmentId),
    specialization: doctor?.specialization ?? "General Practice",
    experienceYears: doctor?.experienceYears != null ? String(doctor.experienceYears) : "0",
    consultationFee: doctor?.consultationFee != null ? String(doctor.consultationFee) : "0",
    bio: doctor?.bio ?? "",
    status:
      doctor?.profileStatus === "approved" || doctor?.isPublic
        ? "active"
        : doctor?.profileStatus === "rejected"
          ? "pending"
          : "pending",
  };
}

function buildDoctorSubmitPayload(form: DoctorFormState) {
  return {
    name: form.name.trim(),
    email: form.email.trim(),
    ...(form.password.trim() ? { password: form.password.trim() } : {}),
    departmentId: form.departmentId || undefined,
    specialization: form.specialization.trim() || "General Practice",
    experienceYears: Number(form.experienceYears || 0),
    consultationFee: Number(form.consultationFee || 0),
    bio: form.bio.trim(),
    status: form.status,
  };
}

export function DoctorUpsertPage({
  expectedRole,
  roleLabel,
  accent,
  title,
  subtitle,
  navItems,
  basePath,
  mode,
  doctorId,
}: DoctorUpsertPageProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [doctor, setDoctor] = useState<DoctorRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [form, setForm] = useState<DoctorFormState>(() => buildDoctorFormState());

  const returnHref = useMemo(() => buildReturnHref(basePath), [basePath]);
  const doctorSectionHref = useMemo(() => buildDoctorSectionHref(basePath, mode, doctorId), [basePath, mode, doctorId]);

  useEffect(() => {
    let active = true;

    async function loadPage() {
      try {
        const user = await getCurrentUser();
        const authenticatedUser = user.data;

        if (!authenticatedUser) {
          router.replace("/login");
          return;
        }

        const currentBasePath = getDoctorBasePath(authenticatedUser.role);
        if (authenticatedUser.role !== expectedRole) {
          if (authenticatedUser.role === "clinic_admin" || authenticatedUser.role === "super_admin") {
            router.replace(buildDoctorSectionHref(currentBasePath as "/admin" | "/superadmin", mode, doctorId));
          } else {
            router.replace(rolePathMap[authenticatedUser.role]);
          }
          return;
        }

        if (!active) {
          return;
        }

        setCurrentUser(authenticatedUser);

        const [departmentsResponse, doctorResponse] = await Promise.all([
          requestJson<DepartmentRecord[]>("/api/departments"),
          mode === "edit" && doctorId
            ? requestJson<DoctorRecord>(`/api/doctors/${doctorId}`)
            : Promise.resolve(null as ApiResponse<DoctorRecord> | null),
        ]);

        if (!active) {
          return;
        }

        setDepartments(departmentsResponse.data ?? []);

        if (mode === "edit" && doctorResponse?.data) {
          setDoctor(doctorResponse.data);
          setForm(buildDoctorFormState(doctorResponse.data));
        } else {
          setDoctor(null);
          setForm(buildDoctorFormState());
        }
      } catch (loadError) {
        if (!active) {
          return;
        }

        const message = loadError instanceof Error ? loadError.message : "Failed to load doctor form";
        if (message.toLowerCase().includes("unauthorized") || message.toLowerCase().includes("forbidden")) {
          router.replace("/login");
          return;
        }

        setError(message);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, [doctorId, expectedRole, mode, router]);

  async function handleLogout() {
    try {
      await logoutUser();
      router.replace("/login");
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Logout failed");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsSaving(true);

    try {
      if (!form.name.trim() || !form.email.trim()) {
        throw new Error("Full name and email are required");
      }

      if (mode === "create" && !form.password.trim()) {
        throw new Error("Temporary password is required");
      }

      const payload = buildDoctorSubmitPayload(form);
      const response = mode === "edit" && doctorId
        ? await requestJson<DoctorRecord>(`/api/doctors/${doctorId}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : await requestJson<DoctorRecord>("/api/doctors", {
            method: "POST",
            body: JSON.stringify(payload),
          });

      setSuccessMessage(response.message ?? (mode === "edit" ? "Doctor updated successfully" : "Doctor created successfully"));

      window.setTimeout(() => {
        router.replace(returnHref);
      }, 900);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save doctor");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <DashboardShell
        roleLabel={roleLabel}
        accent={accent}
        navItems={navItems}
        title={title}
        subtitle={subtitle}
        stats={[]}
        actions={[]}
        highlights={[]}
        nextSteps={[]}
        activeNavLabel="Doctors"
        user={currentUser}
        onNavItemSelect={(label) => router.push(`${basePath}?section=${encodeURIComponent(label)}`)}
        onLogout={handleLogout}
      >
        <section className="bg-slate-50 px-6 pb-10 text-slate-900">
          <div className="mx-auto max-w-[1600px]">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="py-16 text-center">
                <Loader2 className="mx-auto size-8 animate-spin text-slate-700" />
                <p className="mt-4 text-sm text-slate-600">Loading doctor form...</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </DashboardShell>
    );
  }

  if (error && !currentUser) {
    return (
      <DashboardShell
        roleLabel={roleLabel}
        accent={accent}
        navItems={navItems}
        title={title}
        subtitle={subtitle}
        stats={[]}
        actions={[]}
        highlights={[]}
        nextSteps={[]}
        activeNavLabel="Doctors"
        user={currentUser}
        onNavItemSelect={(label) => router.push(`${basePath}?section=${encodeURIComponent(label)}`)}
        onLogout={handleLogout}
      >
        <section className="bg-slate-50 px-6 pb-10 text-slate-900">
          <div className="mx-auto max-w-[1600px]">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="py-16 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Doctors</p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Unable to load doctor form</h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">{error}</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link
                    href={returnHref}
                    className="inline-flex items-center gap-2 rounded-full bg-[#020617] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#020617] hover:text-white"
                  >
                    <ArrowLeft className="size-4" />
                    Back to Doctors
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      roleLabel={roleLabel}
      accent={accent}
      navItems={navItems}
      title={title}
      subtitle={subtitle}
      stats={[]}
      actions={[]}
      highlights={[]}
      nextSteps={[]}
      activeNavLabel="Doctors"
      user={currentUser}
      onNavItemSelect={(label) => router.push(`${basePath}?section=${encodeURIComponent(label)}`)}
      onLogout={handleLogout}
    >
      <section className="bg-slate-50 px-6 pb-10 text-slate-900">
        <div className="mx-auto max-w-[1600px]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Doctors</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  {mode === "edit" ? "Edit doctor" : "Add new doctor"}
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {mode === "edit"
                    ? "Update the doctor account and profile information from this page."
                    : "Create a doctor account and profile for the clinic."}
                </p>
              </div>

              <Link
                href={returnHref}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <ArrowLeft className="size-4" />
                Back to Doctors
              </Link>
            </div>

            {successMessage ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            {error ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Full name</span>
                <Input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="h-12 rounded-2xl border-slate-300 bg-slate-50"
                  placeholder="Dr. Jane Doe"
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="h-12 rounded-2xl border-slate-300 bg-slate-50"
                  placeholder="doctor@example.com"
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  {mode === "edit" ? "Temporary password (optional)" : "Temporary password"}
                </span>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  className="h-12 rounded-2xl border-slate-300 bg-slate-50"
                  placeholder={mode === "edit" ? "Leave blank to keep current password" : "Create a temporary password"}
                  required={mode === "create"}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Department</span>
                <select
                  value={form.departmentId}
                  onChange={(event) => setForm((current) => ({ ...current, departmentId: event.target.value }))}
                  className="h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                >
                  <option value="">Not assigned</option>
                  {departments.map((department) => (
                    <option key={department._id ?? department.name} value={department._id ?? ""}>
                      {department.name ?? "Unnamed department"}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Specialization</span>
                <Input
                  type="text"
                  value={form.specialization}
                  onChange={(event) => setForm((current) => ({ ...current, specialization: event.target.value }))}
                  className="h-12 rounded-2xl border-slate-300 bg-slate-50"
                  placeholder="General Practice"
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Experience (years)</span>
                <Input
                  type="number"
                  min="0"
                  value={form.experienceYears}
                  onChange={(event) => setForm((current) => ({ ...current, experienceYears: event.target.value }))}
                  className="h-12 rounded-2xl border-slate-300 bg-slate-50"
                  placeholder="5"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Consultation fee (NPR)</span>
                <Input
                  type="number"
                  min="0"
                  value={form.consultationFee}
                  onChange={(event) => setForm((current) => ({ ...current, consultationFee: event.target.value }))}
                  className="h-12 rounded-2xl border-slate-300 bg-slate-50"
                  placeholder="1000"
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Bio</span>
                <Textarea
                  value={form.bio}
                  onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
                  className="min-h-[140px] rounded-2xl border-slate-300 bg-slate-50"
                  placeholder="Short doctor profile description"
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Status</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as DoctorFormState["status"],
                    }))
                  }
                  className="h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                </select>
              </label>

              <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center rounded-full bg-[#020617] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#020617] hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSaving ? "Saving..." : mode === "edit" ? "Save changes" : "Create doctor"}
                </button>
                <Link
                  href={returnHref}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </Link>
                <p className="text-sm text-slate-500">
                  {mode === "edit"
                    ? "Updates refresh the doctor profile and keep the existing account linked."
                    : "The doctor can log in immediately with the temporary password."}
                </p>
              </div>
            </form>

            {mode === "edit" && doctor ? (
              <Card className="mt-6 border-slate-200 bg-slate-50 shadow-none">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-950">Current doctor summary</CardTitle>
                  <CardDescription>Loaded from the live backend before editing.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Name</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{getDoctorUserName(doctor.userId) || "Doctor"}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{doctor.profileStatus ?? "pending"}</p>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
