"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, PencilLine, Stethoscope, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardShell } from "./dashboard-shell";
import { API_BASE_URL } from "@/lib/api";
import { getCurrentUser, logoutUser, type AuthRole, type AuthUser } from "@/lib/auth";
import { requestJson } from "@/lib/api-client";

import {
  type AvailabilityRecord,
  getDoctorAvatarUrl,
  getNextAvailabilityLabel,
  resolveClinicName,
  resolveDepartmentName,
  resolveDoctorName,
} from "../doctors/doctor-helpers";

type DashboardNavItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  href?: string;
};

type DoctorDashboardPageProps = {
  expectedRole: "clinic_admin" | "super_admin";
  roleLabel: string;
  accent: string;
  title: string;
  subtitle: string;
  navItems: DashboardNavItem[];
  basePath: "/admin" | "/superadmin";
  doctorId?: string;
};

type DoctorDetailRecord = {
  _id: string;
  userId?:
    | {
        name?: string;
        email?: string;
        phone?: string;
        avatar?: string;
        role?: string;
      }
    | string;
  clinicId?:
    | {
        name?: string;
        city?: string;
      }
    | string;
  departmentId?:
    | {
        name?: string;
        description?: string;
      }
    | string;
  specialization?: string;
  qualification?: string;
  address?: string;
  experienceYears?: number;
  consultationFee?: number;
  bio?: string;
  languages?: string[];
  profileStatus?: "pending" | "approved" | "rejected" | string;
  isPublic?: boolean;
  isAvailable?: boolean;
  pendingProfileUpdate?: {
    status?: "pending" | "approved" | "rejected" | string;
    requestedAt?: string;
    requestedBy?:
      | {
          name?: string;
          email?: string;
        }
      | string;
    changes?: {
      user?: {
        name?: string;
        email?: string;
        phone?: string;
        avatar?: string;
      };
      doctor?: {
        specialization?: string;
        qualification?: string;
        address?: string;
        experienceYears?: number;
        consultationFee?: number;
        bio?: string;
      };
    };
  } | null;
  createdAt?: string;
  updatedAt?: string;
};

const rolePathMap: Record<AuthRole, string> = {
  patient: "/patient",
  doctor: "/doctor",
  clinic_admin: "/admin",
  super_admin: "/superadmin",
};

function getDoctorInitials(doctor?: DoctorDetailRecord | null) {
  const name = resolveDoctorName(doctor as never).trim();
  if (!name) {
    return "D";
  }

  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function doctorStatusMeta(status?: string, isPublic?: boolean) {
  switch (status) {
    case "pending":
      return {
        label: "Pending",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
    case "approved":
      return {
        label: isPublic ? "Approved" : "Approved · Hidden",
        className: isPublic ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200",
      };
    case "rejected":
      return {
        label: "Rejected",
        className: "bg-rose-50 text-rose-700 border-rose-200",
      };
    default:
      return {
        label: status ?? "Unknown",
        className: "bg-slate-100 text-slate-600 border-slate-200",
      };
  }
}

function formatCurrency(value?: number | null) {
  if (typeof value !== "number") {
    return "On request";
  }

  return `NPR ${new Intl.NumberFormat("en-NP").format(value)}`;
}

function formatExperience(value?: number | null) {
  if (typeof value !== "number") {
    return "Not listed";
  }

  return `${value} year${value === 1 ? "" : "s"} experience`;
}

function formatTime(value?: string) {
  if (!value) {
    return "--:--";
  }

  return value.slice(0, 5);
}

function formatProfileValue(value?: string | number | null) {
  if (value === null || value === undefined) {
    return "Not provided";
  }

  if (typeof value === "number") {
    return value.toString();
  }

  return value.trim() || "Not provided";
}

function resolveAvatarUrl(value?: string | null) {
  const avatar = value?.trim();
  if (!avatar) {
    return "";
  }

  if (avatar.startsWith("data:") || avatar.startsWith("http://") || avatar.startsWith("https://")) {
    return avatar;
  }

  return avatar.startsWith("/") ? `${API_BASE_URL}${avatar}` : `${API_BASE_URL}/${avatar}`;
}

function formatScheduleLabel(record: AvailabilityRecord) {
  const day = record.dayOfWeek ? record.dayOfWeek.charAt(0).toUpperCase() + record.dayOfWeek.slice(1) : "Unknown day";
  return `${day} · ${formatTime(record.startTime)}-${formatTime(record.endTime)}`;
}

function resolveDoctorRolePath(role?: AuthRole) {
  return role ? rolePathMap[role] : "/login";
}

export function DoctorManagementPage({
  expectedRole,
  roleLabel,
  accent,
  title,
  subtitle,
  navItems,
  basePath,
  doctorId,
}: DoctorDashboardPageProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [doctor, setDoctor] = useState<DoctorDetailRecord | null>(null);
  const [availability, setAvailability] = useState<AvailabilityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingAction, setIsSavingAction] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadPage() {
    if (!doctorId) {
      setError("Doctor id is required");
      setIsLoading(false);
      return;
    }

    try {
      const user = await getCurrentUser();
      const authenticatedUser = user.data;

      if (!authenticatedUser) {
        router.replace("/login");
        return;
      }

      const currentBasePath = authenticatedUser.role === "super_admin" ? "/superadmin" : "/admin";
      if (authenticatedUser.role !== expectedRole) {
        if (authenticatedUser.role === "clinic_admin" || authenticatedUser.role === "super_admin") {
          router.replace(`${currentBasePath}/doctors/${doctorId}`);
        } else {
          router.replace(resolveDoctorRolePath(authenticatedUser.role));
        }
        return;
      }

      setCurrentUser(authenticatedUser);

      const [doctorResponse, availabilityResponse] = await Promise.all([
        requestJson<DoctorDetailRecord>(`/api/doctors/${doctorId}`),
        requestJson<AvailabilityRecord[]>(`/api/availability/doctor/${doctorId}`),
      ]);

      setDoctor(doctorResponse.data ?? null);
      setAvailability(availabilityResponse.data ?? []);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to load doctor details";

      if (message.toLowerCase().includes("unauthorized") || message.toLowerCase().includes("forbidden")) {
        router.replace("/login");
        return;
      }

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      await loadPage();
      if (!active) {
        return;
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, [doctorId, expectedRole, router]);

  async function handleLogout() {
    try {
      await logoutUser();
      router.replace("/login");
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Logout failed");
    }
  }

  async function handleDoctorAction(action: "approve" | "reject" | "unpublish") {
    if (!doctorId) {
      return;
    }

    setError("");
    setSuccessMessage("");
    setIsSavingAction(true);

    try {
      const endpoint =
        action === "approve"
          ? `/api/doctors/${doctorId}/approve`
          : action === "reject"
            ? `/api/doctors/${doctorId}/reject`
            : `/api/doctors/${doctorId}/unpublish`;

      await requestJson(endpoint, { method: "PATCH" });
      setSuccessMessage(
        action === "approve"
          ? "Doctor approved successfully."
          : action === "reject"
            ? "Doctor rejected successfully."
            : "Doctor unpublished successfully.",
      );
      await loadPage();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Failed to update doctor");
    } finally {
      setIsSavingAction(false);
    }
  }

  function openEditPage() {
    if (!doctorId) {
      return;
    }

    router.push(`${basePath}/doctors/${doctorId}/edit`);
  }

  const doctorRecord = doctor as DoctorDetailRecord;
  const statusMeta = doctorStatusMeta(doctorRecord.profileStatus, doctorRecord.isPublic);
  const hasPendingProfileUpdate = doctorRecord.pendingProfileUpdate?.status === "pending";
  const isPendingDoctor = doctorRecord.profileStatus === "pending" && !hasPendingProfileUpdate;
  const activeSectionLabel = isPendingDoctor ? "Doctor Approvals" : "Doctors";
  const returnHref = `${basePath}?section=${encodeURIComponent(activeSectionLabel)}`;
  const avatarUrl = getDoctorAvatarUrl(doctorRecord);
  const nextAvailability = availability.length > 0 ? getNextAvailabilityLabel(availability) : "";
  const pendingChanges = doctorRecord.pendingProfileUpdate?.changes ?? {};
  const pendingUserChanges = pendingChanges.user ?? {};
  const pendingDoctorChanges = pendingChanges.doctor ?? {};
  const requestedAvatarUrl = resolveAvatarUrl(pendingUserChanges.avatar ?? null);
  const liveDoctorName = resolveDoctorName(doctorRecord as never);
  const requestedDoctorName = formatProfileValue(pendingUserChanges.name ?? null);
  const currentEmail = typeof doctorRecord.userId === "string" ? "Not available" : doctorRecord.userId?.email ?? "Not available";
  const currentPhone = typeof doctorRecord.userId === "string" ? "Not available" : doctorRecord.userId?.phone ?? "Not available";
  const requestedEmail = formatProfileValue(pendingUserChanges.email ?? null);
  const requestedPhone = formatProfileValue(pendingUserChanges.phone ?? null);
  const requestedSpecialization = formatProfileValue(pendingDoctorChanges.specialization ?? null);
  const requestedQualification = formatProfileValue(pendingDoctorChanges.qualification ?? null);
  const requestedAddress = formatProfileValue(pendingDoctorChanges.address ?? null);
  const requestedExperience = formatProfileValue(pendingDoctorChanges.experienceYears ?? null);
  const requestedFee = formatProfileValue(pendingDoctorChanges.consultationFee ?? null);

  if (isLoading) {
    return (
      <DashboardShell
        roleLabel={roleLabel}
        title={title}
        subtitle={subtitle}
        accent={accent}
        navItems={navItems}
        stats={[]}
        actions={[]}
        highlights={[]}
        nextSteps={[]}
        user={currentUser}
        onLogout={handleLogout}
      >
        <div className="px-6 py-10 text-slate-900 sm:px-8 lg:px-10">
          <Card className="mx-auto max-w-4xl border-slate-200 bg-white shadow-sm">
            <CardContent className="py-16 text-center">
              <div className="mx-auto size-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />
              <p className="mt-4 text-sm font-medium text-slate-600">Loading doctor details...</p>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    );
  }

  if (error && !doctor) {
    return (
      <DashboardShell
        roleLabel={roleLabel}
        title={title}
        subtitle={subtitle}
        accent={accent}
        navItems={navItems}
        stats={[]}
        actions={[]}
        highlights={[]}
        nextSteps={[]}
        user={currentUser}
        onLogout={handleLogout}
      >
        <div className="px-6 py-10 text-slate-900 sm:px-8 lg:px-10">
          <Card className="mx-auto max-w-4xl border-slate-200 bg-white shadow-sm">
            <CardContent className="py-14 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Doctor management</p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight">Unable to load doctor details</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">{error}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Try again
                </button>
                <Link
                  href={returnHref}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <ArrowLeft className="size-4" />
                  Back to doctors
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    );
  }

  if (!doctor) {
    return null;
  }

  return (
    <DashboardShell
      roleLabel={roleLabel}
      title={title}
      subtitle={subtitle}
      accent={accent}
      navItems={navItems}
      stats={[]}
      actions={[]}
      highlights={[]}
      nextSteps={[]}
      user={currentUser}
      onLogout={handleLogout}
      activeNavLabel={activeSectionLabel}
    >
      <section className="bg-slate-50 px-6 py-6 text-slate-900 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1600px]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-4xl">
                <Link href={returnHref} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700">
                  <ArrowLeft className="size-4" />
                  Back to {isPendingDoctor ? "approvals" : "doctors"}
                </Link>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Badge className="rounded-full bg-sky-50 px-3 py-1 text-sky-700 hover:bg-sky-50">
                    <Stethoscope className="mr-1 size-3.5" />
                    Doctor management
                  </Badge>
                  <Badge className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>{statusMeta.label}</Badge>
                  <Badge
                    className={
                      doctor.isAvailable
                        ? "rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 hover:bg-emerald-50"
                        : "rounded-full border-slate-200 px-3 py-1 text-slate-500"
                    }
                  >
                    {doctor.isAvailable ? "Available" : "Unavailable"}
                  </Badge>
                  {nextAvailability ? (
                    <Badge className="rounded-full border-sky-200 bg-sky-50 px-3 py-1 text-sky-700 hover:bg-sky-50">
                      {nextAvailability}
                    </Badge>
                  ) : null}
                </div>

                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{resolveDoctorName(doctor as never)}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                  {isPendingDoctor
                    ? doctor.bio ?? "Review the pending doctor profile, availability schedule, and approve or edit the profile here."
                    : doctor.bio ?? "Review the live doctor profile and availability schedule here."}
                </p>
              </div>

              {isPendingDoctor || hasPendingProfileUpdate ? (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleDoctorAction("approve")}
                    disabled={isSavingAction}
                    className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold !text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    style={{ color: "#ffffff" }}
                    >
                    {isSavingAction ? "Updating..." : hasPendingProfileUpdate ? "Approve update" : "Approve"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDoctorAction("reject")}
                    disabled={isSavingAction}
                    className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {hasPendingProfileUpdate ? "Reject update" : "Reject"}
                  </button>
                  <button
                    type="button"
                    onClick={openEditPage}
                    className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    <PencilLine className="mr-2 size-4" />
                    Edit
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Approval actions are available only for pending doctor profiles.
                </div>
              )}
            </div>

            {successMessage ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div>
            ) : null}
            {error ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : null}

            <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
              <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-slate-50 via-white to-sky-50 p-4">
                    <div className="h-72 overflow-hidden rounded-[1.5rem] bg-white">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt={resolveDoctorName(doctor as never)} className="h-full w-full object-contain object-center p-3" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <div className="grid size-24 place-items-center rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-cyan-500 text-4xl font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.2)]">
                            {getDoctorInitials(doctor)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold tracking-tight text-slate-950">{resolveDoctorName(doctor as never)}</p>
                        <p className="mt-1 text-sm text-slate-500">{typeof doctor.userId === "string" ? "Email unavailable" : doctor.userId?.email ?? "Email unavailable"}</p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>{statusMeta.label}</span>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Available</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{doctor.isAvailable ? "Yes" : "No"}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Public</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{doctor.isPublic ? "Yes" : "No"}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Created</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {doctor.createdAt ? new Date(doctor.createdAt).toLocaleDateString() : "Not available"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {hasPendingProfileUpdate ? (
                  <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50/80 p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">Pending profile update</p>
                        <p className="mt-2 text-sm leading-6 text-amber-900">
                          The doctor submitted changes that are waiting for review. The live profile stays unchanged until approved.
                        </p>
                      </div>
                      <span className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-700">
                        Waiting review
                      </span>
                    </div>

                <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-amber-200 bg-white">
                  <div className="grid border-b border-amber-100 bg-amber-50/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800 md:grid-cols-[1.15fr_1fr_1fr]">
                    <span>Field</span>
                    <span>Current live value</span>
                    <span>Requested change</span>
                  </div>

                  <div className="grid gap-0 md:grid-cols-[1.15fr_1fr_1fr]">
                    <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-950">Photo</div>
                    <div className="border-b border-slate-100 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid size-12 place-items-center overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-200">
                          {avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatarUrl} alt={liveDoctorName} className="size-full object-contain object-center p-1" />
                          ) : (
                            <span className="text-sm font-semibold text-slate-400">No photo</span>
                          )}
                        </div>
                        <span className="text-sm text-slate-700">{avatarUrl ? "Uploaded doctor photo" : "No photo uploaded"}</span>
                      </div>
                    </div>
                    <div className="border-b border-slate-100 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid size-12 place-items-center overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-amber-200">
                          {requestedAvatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={requestedAvatarUrl}
                              alt={requestedDoctorName}
                              className="size-full object-contain object-center p-1"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-slate-400">No change</span>
                          )}
                        </div>
                        <span className="text-sm text-slate-700">{requestedAvatarUrl ? "New requested photo" : "No photo change"}</span>
                      </div>
                    </div>

                    {[
                      { label: "Name", current: liveDoctorName, requested: requestedDoctorName },
                      { label: "Email", current: currentEmail, requested: requestedEmail },
                      { label: "Phone", current: currentPhone, requested: requestedPhone },
                      { label: "Specialization", current: doctor.specialization ?? "General Practice", requested: requestedSpecialization },
                      { label: "Qualification", current: doctor.qualification ?? "Not listed", requested: requestedQualification },
                      { label: "Address", current: doctor.address ?? "Not listed", requested: requestedAddress },
                      { label: "Experience", current: formatExperience(doctor.experienceYears), requested: requestedExperience },
                      { label: "Fee", current: formatCurrency(doctor.consultationFee), requested: requestedFee },
                    ].map((item) => {
                      const requestedIsMissing = item.requested === "Not provided";
                      const currentMatchesRequested = !requestedIsMissing && item.current === item.requested;

                      return (
                        <div key={item.label} className="grid border-b border-slate-100 md:col-span-3 md:grid-cols-[1.15fr_1fr_1fr]">
                          <div className="px-4 py-3 text-sm font-semibold text-slate-950">{item.label}</div>
                          <div className="px-4 py-3 text-sm text-slate-700">
                            {item.current}
                          </div>
                          <div className={`px-4 py-3 text-sm ${requestedIsMissing ? "text-slate-400" : currentMatchesRequested ? "text-slate-500" : "font-medium text-amber-800"}`}>
                            {requestedIsMissing ? "No change requested" : item.requested}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
                ) : null}

                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Profile details</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Department</p>
                      <p className="mt-2 text-sm font-medium text-slate-900">{resolveDepartmentName(doctor as never)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Clinic</p>
                      <p className="mt-2 text-sm font-medium text-slate-900">{resolveClinicName(doctor as never)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Specialization</p>
                      <p className="mt-2 text-sm font-medium text-slate-900">{doctor.specialization ?? "General Practice"}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Qualification</p>
                      <p className="mt-2 text-sm font-medium text-slate-900">{doctor.qualification ?? "Not listed"}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Address</p>
                      <p className="mt-2 text-sm font-medium text-slate-900">{doctor.address ?? "Not listed"}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Experience</p>
                      <p className="mt-2 text-sm font-medium text-slate-900">{formatExperience(doctor.experienceYears)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Consultation fee</p>
                      <p className="mt-2 text-sm font-medium text-slate-900">{formatCurrency(doctor.consultationFee)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Phone</p>
                      <p className="mt-2 text-sm font-medium text-slate-900">{typeof doctor.userId === "string" ? "Not available" : doctor.userId?.phone ?? "Not available"}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Bio and schedule</p>
                  <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Bio</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {doctor.bio ?? "No bio has been provided for this doctor profile yet."}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Languages</p>
                      <p className="mt-2 text-sm font-medium text-slate-900">
                        {doctor.languages && doctor.languages.length > 0 ? doctor.languages.join(", ") : "Not listed"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Availability</p>
                    {availability.length > 0 ? (
                      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {availability.map((slot) => (
                          <div key={slot._id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-sm font-semibold text-slate-950">{formatScheduleLabel(slot)}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {slot.isActive === false ? "Inactive slot" : "Active slot"}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                        No availability slots are configured.
                      </div>
                    )}
                  </div>
                </div>

                {!isPendingDoctor ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Approval actions are available only for pending doctor profiles.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
