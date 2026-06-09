"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { BellRing } from "lucide-react";

import { DashboardShell } from "./dashboard-shell";
import { getCurrentUser, logoutUser, type AuthRole, type AuthUser } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/api";
import { requestJson } from "@/lib/api-client";

type DashboardNavItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
};

type DashboardRouteConfig = {
  expectedRole: AuthRole;
  roleLabel: string;
  accent: string;
  title: string;
  subtitle: string;
  navItems: DashboardNavItem[];
  primaryActionLabel: string;
  secondaryActionLabel: string;
};

type DashboardContent = {
  stats: { label: string; value: string; detail: string }[];
  highlights: string[];
  nextSteps: string[];
  reportStats?: { label: string; value: string; detail: string }[];
  reportHighlights?: string[];
  reportAppointments?: AppointmentRecord[];
  doctors?: DoctorRecord[];
  availabilityByDoctorId?: Record<string, AvailabilityRecord[]>;
  departments?: DepartmentRecord[];
  appointments?: AppointmentRecord[];
  availability?: AvailabilityRecord[];
  doctorsError?: string;
  departmentsError?: string;
  appointmentsError?: string;
  availabilityError?: string;
  appointmentStatusSummary?: { label: string; value: string; className: string }[];
  reportStatusSummary?: { label: string; value: string; className: string }[];
  reportError?: string;
  doctorProfileId?: string;
};

type SectionHeroCard = {
  title: string;
  text: string;
};

type ApiListResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  unreadCount?: number;
};

type AppointmentRecord = {
  _id?: string;
  status?: string;
  appointmentDate?: string;
  startTime?: string;
  reason?: string;
  patientId?: {
    userId?: {
      name?: string;
      email?: string;
    };
  } | string;
  doctorId?: {
    userId?: {
      name?: string;
      email?: string;
    };
    specialization?: string;
  } | string;
};

type DoctorRecord = {
  _id?: string;
  specialization?: string;
  profileStatus?: "pending" | "approved" | "rejected" | string;
  isPublic?: boolean;
  consultationFee?: number;
  experienceYears?: number;
  bio?: string;
  isAvailable?: boolean;
  clinicId?:
    | {
        _id?: string;
        name?: string;
        city?: string;
      }
    | string;
  userId?:
    | {
        name?: string;
        email?: string;
        avatar?: string;
      }
    | string;
  departmentId?:
    | {
      _id?: string;
      name?: string;
    }
    | string;
};

type DepartmentRecord = {
  _id?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  clinicId?:
    | {
        _id?: string;
        name?: string;
        city?: string;
      }
    | string;
};

type AvailabilityRecord = {
  _id?: string;
  doctorId?:
    | {
        _id?: string;
        userId?: {
          name?: string;
          email?: string;
        };
        specialization?: string;
      }
    | string;
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
  slotDurationMinutes?: number;
  isActive?: boolean;
};

type DoctorCreationStatus = "pending" | "active";

type DoctorCreationFormState = {
  name: string;
  email: string;
  password: string;
  departmentId: string;
  specialization: string;
  experienceYears: string;
  consultationFee: string;
  bio: string;
  status: DoctorCreationStatus;
};

type OverviewRecord = {
  totalDoctors?: number;
  totalPatients?: number;
  totalAppointments?: number;
  pendingAppointments?: number;
  confirmedAppointments?: number;
  completedAppointments?: number;
  cancelledAppointments?: number;
  noShowAppointments?: number;
  doctorId?: string;
};

type DashboardRoutePageProps = {
  config: DashboardRouteConfig;
};

const rolePathMap: Record<AuthRole, string> = {
  patient: "/patient",
  doctor: "/doctor",
  clinic_admin: "/admin",
  super_admin: "/superadmin",
};

function formatCount(value: number) {
  return value.toLocaleString();
}

function parseCount(value?: string) {
  if (!value) {
    return 0;
  }

  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPercentage(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function sumCountValues(items?: { value: string }[]) {
  return (items ?? []).reduce((total, item) => total + parseCount(item.value), 0);
}

function formatAppointmentDate(value?: string) {
  if (!value) {
    return "Date not set";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatAppointmentDoctor(doctor?: AppointmentRecord["doctorId"]) {
  if (!doctor) {
    return "Doctor not assigned";
  }

  if (typeof doctor === "string") {
    return "Doctor details unavailable";
  }

  return doctor.userId?.name ?? doctor.specialization ?? "Doctor details unavailable";
}

function formatDoctorName(doctor?: DoctorRecord) {
  if (!doctor) {
    return "Doctor";
  }

  if (typeof doctor.userId === "string") {
    return "Doctor profile";
  }

  return doctor.userId?.name ?? "Doctor";
}

function getDoctorInitials(doctor?: DoctorRecord) {
  const name = formatDoctorName(doctor).trim();

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

function getDoctorAvatarSrc(doctor?: DoctorRecord) {
  if (!doctor || !doctor.userId || typeof doctor.userId === "string") {
    return "";
  }

  const avatar = doctor.userId.avatar?.trim();
  if (!avatar) {
    return "";
  }

  if (avatar.startsWith("data:") || avatar.startsWith("http://") || avatar.startsWith("https://")) {
    return avatar;
  }

  return avatar.startsWith("/") ? `${API_BASE_URL}${avatar}` : `${API_BASE_URL}/${avatar}`;
}

function formatDoctorFee(doctor?: DoctorRecord) {
  if (doctor?.consultationFee == null) {
    return "Fee not set";
  }

  return `NPR ${doctor.consultationFee.toLocaleString()}`;
}

function resolveDoctorDepartmentName(doctor?: DoctorRecord) {
  if (!doctor) {
    return "Not assigned";
  }

  if (typeof doctor.departmentId === "string") {
    return "Not assigned";
  }

  return doctor.departmentId?.name ?? "Not assigned";
}

function matchesDoctorSearch(doctor: DoctorRecord, searchQuery: string) {
  if (!searchQuery.trim()) {
    return true;
  }

  const query = searchQuery.trim().toLowerCase();
  const haystacks = [
    formatDoctorName(doctor),
    doctor.specialization ?? "",
    resolveDoctorDepartmentName(doctor),
    typeof doctor.userId === "string" ? "" : doctor.userId?.email ?? "",
  ];

  return haystacks.some((value) => value.toLowerCase().includes(query));
}

function formatAppointmentPatient(patient?: AppointmentRecord["patientId"]) {
  if (!patient) {
    return "Patient details unavailable";
  }

  if (typeof patient === "string") {
    return "Patient details unavailable";
  }

  return patient.userId?.name ?? "Patient details unavailable";
}

function appointmentStatusMeta(status?: string) {
  switch (status) {
    case "pending":
      return { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" };
    case "confirmed":
      return { label: "Confirmed", className: "bg-sky-50 text-sky-700 border-sky-200" };
    case "completed":
      return { label: "Completed", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "cancelled":
      return { label: "Cancelled", className: "bg-slate-100 text-slate-600 border-slate-200" };
    case "no_show":
      return { label: "No show", className: "bg-rose-50 text-rose-700 border-rose-200" };
    default:
      return { label: status ?? "Unknown", className: "bg-slate-100 text-slate-600 border-slate-200" };
  }
}

function availabilityDayLabel(dayOfWeek?: string) {
  switch (dayOfWeek) {
    case "monday":
      return "Monday";
    case "tuesday":
      return "Tuesday";
    case "wednesday":
      return "Wednesday";
    case "thursday":
      return "Thursday";
    case "friday":
      return "Friday";
    case "saturday":
      return "Saturday";
    case "sunday":
      return "Sunday";
    default:
      return dayOfWeek ?? "Day not set";
  }
}

function formatTime(value?: string) {
  if (!value) {
    return "--:--";
  }

  return value;
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

function doctorCardStatusLabel(status?: string) {
  switch (status) {
    case "pending":
      return "Pending";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return status ?? "Unknown";
  }
}

function countAppointmentsByStatus(appointments: AppointmentRecord[], status: string) {
  return appointments.filter((appointment) => appointment.status === status).length;
}

function countUpcomingAppointments(appointments: AppointmentRecord[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return appointments.filter((appointment) => {
    if (!appointment.appointmentDate) {
      return false;
    }

    const appointmentDate = new Date(appointment.appointmentDate);
    return appointmentDate >= today && appointment.status !== "cancelled";
  }).length;
}

function resolveId(ref?: { _id?: string } | string) {
  if (!ref) {
    return "";
  }

  if (typeof ref === "string") {
    return ref;
  }

  return ref._id ?? "";
}

function countUniqueClinics(doctors: DoctorRecord[], departments: DepartmentRecord[]) {
  const clinicIds = new Set<string>();

  doctors.forEach((doctor) => {
    const clinicId = resolveId(doctor.clinicId);
    if (clinicId) {
      clinicIds.add(clinicId);
    }
  });

  departments.forEach((department) => {
    const clinicId = resolveId(department.clinicId);
    if (clinicId) {
      clinicIds.add(clinicId);
    }
  });

  if (clinicIds.size > 0) {
    return clinicIds.size;
  }

  if (doctors.length > 0 || departments.length > 0) {
    return 1;
  }

  return 0;
}

function buildRecentActivitySummary({
  pendingDoctors,
  departments,
  appointments,
  overviewError,
}: {
  pendingDoctors: number;
  departments: DepartmentRecord[];
  appointments: AppointmentRecord[];
  overviewError?: string;
}) {
  const sortedAppointments = [...appointments].sort((left, right) => {
    const leftTime = left.appointmentDate ? new Date(left.appointmentDate).getTime() : 0;
    const rightTime = right.appointmentDate ? new Date(right.appointmentDate).getTime() : 0;
    return rightTime - leftTime;
  });

  const latestAppointment = sortedAppointments[0];

  return [
    pendingDoctors > 0
      ? `${pendingDoctors} doctor profile${pendingDoctors === 1 ? "" : "s"} are waiting for approval.`
      : "No doctor profiles are waiting for approval right now.",
    latestAppointment
      ? `Latest appointment: ${formatAppointmentDate(latestAppointment.appointmentDate)} Â· ${appointmentStatusMeta(latestAppointment.status).label}.`
      : "No recent appointment activity has been recorded yet.",
    departments.length > 0
      ? `${departments.length} department${departments.length === 1 ? "" : "s"} are available across the platform.`
      : "No departments have been created yet.",
    ...(overviewError ? [`Overview feed: ${overviewError}`] : []),
  ];
}

function buildReportSummary({
  totalAppointments,
  completedAppointments,
  cancelledAppointments,
  totalDoctors,
  totalPatients,
  totalDepartments,
  overviewError,
}: {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalDoctors: number;
  totalPatients: number;
  totalDepartments: number;
  overviewError?: string;
}) {
  return [
    `Reports are tracking ${totalAppointments} appointment${totalAppointments === 1 ? "" : "s"} across the platform.`,
    `${completedAppointments} appointment${completedAppointments === 1 ? "" : "s"} are completed and ${cancelledAppointments} are cancelled.`,
    `Platform coverage includes ${totalDoctors} doctor${totalDoctors === 1 ? "" : "s"}, ${totalPatients} patient${totalPatients === 1 ? "" : "s"}, and ${totalDepartments} department${totalDepartments === 1 ? "" : "s"}.`,
    ...(overviewError ? [`Report feed: ${overviewError}`] : []),
  ];
}

function SectionHero({
  label,
  title,
  subtitle,
  cards,
}: {
  label: string;
  title: string;
  subtitle: string;
  cards: SectionHeroCard[];
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">{label}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <article key={card.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Clinic area</p>
            <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">{card.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

async function loadPatientContent(): Promise<DashboardContent> {
  const [appointmentsResult, notificationsResult, doctorsResult] = await Promise.allSettled([
    requestJson<AppointmentRecord[]>("/api/appointments/me"),
    requestJson<unknown>("/api/notifications/me"),
    requestJson<DoctorRecord[]>("/api/doctors"),
  ]);

  const appointments = appointmentsResult.status === "fulfilled" ? appointmentsResult.value.data ?? [] : [];
  const appointmentsError =
    appointmentsResult.status === "rejected"
      ? appointmentsResult.reason instanceof Error
        ? appointmentsResult.reason.message
        : "Failed to load appointments"
      : "";
  const unreadCount = notificationsResult.status === "fulfilled" ? notificationsResult.value.unreadCount ?? 0 : 0;
  const doctorCount = doctorsResult.status === "fulfilled" ? doctorsResult.value.data?.length ?? 0 : 0;
  const doctors = doctorsResult.status === "fulfilled" ? doctorsResult.value.data ?? [] : [];
  const doctorsError =
    doctorsResult.status === "rejected"
      ? doctorsResult.reason instanceof Error
        ? doctorsResult.reason.message
        : "Failed to load doctors"
      : "";
  const availabilityEntries = await Promise.allSettled(
    doctors
      .map((doctor) => doctor._id)
      .filter((doctorId): doctorId is string => Boolean(doctorId))
      .map(async (doctorId) => {
        const availabilityResponse = await requestJson<AvailabilityRecord[]>(`/api/availability/doctor/${doctorId}`);
        return [doctorId, availabilityResponse.data ?? []] as const;
      }),
  );

  const availabilityByDoctorId = availabilityEntries.reduce<Record<string, AvailabilityRecord[]>>((summary, result) => {
    if (result.status === "fulfilled") {
      const [doctorId, availability] = result.value;
      summary[doctorId] = availability;
    }

    return summary;
  }, {});

  const upcomingAppointments = countUpcomingAppointments(appointments);
  const completedAppointments = appointments.filter((appointment) => appointment.status === "completed").length;
  const pendingAppointments = countAppointmentsByStatus(appointments, "pending");
  const confirmedAppointments = countAppointmentsByStatus(appointments, "confirmed");
  const cancelledAppointments = countAppointmentsByStatus(appointments, "cancelled");
  const noShowAppointments = countAppointmentsByStatus(appointments, "no_show");

  return {
    stats: [
      { label: "Upcoming visits", value: formatCount(upcomingAppointments), detail: "Appointments coming up next." },
      { label: "Completed", value: formatCount(completedAppointments), detail: "Appointments already completed." },
      { label: "Doctors", value: formatCount(doctorCount), detail: "Available doctors in the system." },
      { label: "Unread alerts", value: formatCount(unreadCount), detail: "Notifications waiting to be read." },
    ],
    highlights: [
      `You have ${upcomingAppointments} upcoming appointment${upcomingAppointments === 1 ? "" : "s"} in the live feed.`,
      unreadCount > 0
        ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`
        : "No unread notifications right now.",
    ],
    nextSteps: [
      "Connect the appointments API to show the actual booking timeline and cancellation actions.",
      "Add patient profile editing and reminder details to complete this shell.",
    ],
    appointments,
    appointmentsError,
    doctors,
    doctorsError,
    availabilityByDoctorId,
    appointmentStatusSummary: [
      { label: "Pending", value: formatCount(pendingAppointments), className: "bg-amber-50 text-amber-700 border-amber-200" },
      { label: "Confirmed", value: formatCount(confirmedAppointments), className: "bg-sky-50 text-sky-700 border-sky-200" },
      { label: "Completed", value: formatCount(completedAppointments), className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      { label: "Cancelled", value: formatCount(cancelledAppointments), className: "bg-slate-100 text-slate-600 border-slate-200" },
      { label: "No show", value: formatCount(noShowAppointments), className: "bg-rose-50 text-rose-700 border-rose-200" },
    ],
  };
}

async function loadDoctorContent(): Promise<DashboardContent> {
  const [overviewResult, notificationsResult, appointmentsResult] = await Promise.allSettled([
    requestJson<OverviewRecord>("/api/reports/doctor-overview"),
    requestJson<unknown>("/api/notifications/me"),
    requestJson<AppointmentRecord[]>("/api/appointments/me"),
  ]);

  const overview = overviewResult.status === "fulfilled" ? overviewResult.value.data : undefined;
  const unreadCount = notificationsResult.status === "fulfilled" ? notificationsResult.value.unreadCount ?? 0 : 0;
  const appointments = appointmentsResult.status === "fulfilled" ? appointmentsResult.value.data ?? [] : [];
  const appointmentsError =
    appointmentsResult.status === "rejected"
      ? appointmentsResult.reason instanceof Error
        ? appointmentsResult.reason.message
        : "Failed to load appointments"
      : "";

  const totalAppointments = overview?.totalAppointments ?? 0;
  const pendingAppointments = overview?.pendingAppointments ?? countAppointmentsByStatus(appointments, "pending");
  const confirmedAppointments = overview?.confirmedAppointments ?? countAppointmentsByStatus(appointments, "confirmed");
  const completedAppointments = overview?.completedAppointments ?? countAppointmentsByStatus(appointments, "completed");
  const cancelledAppointments = overview?.cancelledAppointments ?? countAppointmentsByStatus(appointments, "cancelled");
  const noShowAppointments = overview?.noShowAppointments ?? countAppointmentsByStatus(appointments, "no_show");
  const doctorId = overview?.doctorId ?? "";
  let availability: AvailabilityRecord[] = [];
  let availabilityError = "";

  if (doctorId) {
    try {
      const availabilityResponse = await requestJson<AvailabilityRecord[]>(`/api/availability/doctor/${doctorId}`);
      availability = availabilityResponse.data ?? [];
    } catch (availabilityFetchError) {
      availabilityError =
        availabilityFetchError instanceof Error ? availabilityFetchError.message : "Failed to load availability";
    }
  } else {
    availabilityError = "Doctor profile not found";
  }

  return {
    stats: [
      { label: "Appointments", value: formatCount(totalAppointments), detail: "Live appointment count for this doctor." },
      { label: "Pending", value: formatCount(overview?.pendingAppointments ?? 0), detail: "Appointments awaiting review." },
      { label: "Completed", value: formatCount(overview?.completedAppointments ?? 0), detail: "Appointments already closed." },
      { label: "Unread alerts", value: formatCount(unreadCount), detail: "Notifications waiting to be read." },
    ],
    highlights: [
      `The live overview shows ${totalAppointments} appointment${totalAppointments === 1 ? "" : "s"} for this doctor.`,
      unreadCount > 0
        ? `There ${unreadCount === 1 ? "is" : "are"} ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`
        : "No unread notifications right now.",
    ],
    nextSteps: [
      "Connect the doctor appointment list and availability controls to this shell.",
      "Add patient detail panels and appointment status updates next.",
    ],
    appointments,
    appointmentsError,
    availability,
    availabilityError,
    doctorProfileId: doctorId,
    appointmentStatusSummary: [
      { label: "Pending", value: formatCount(pendingAppointments), className: "bg-amber-50 text-amber-700 border-amber-200" },
      { label: "Confirmed", value: formatCount(confirmedAppointments), className: "bg-sky-50 text-sky-700 border-sky-200" },
      { label: "Completed", value: formatCount(completedAppointments), className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      { label: "Cancelled", value: formatCount(cancelledAppointments), className: "bg-slate-100 text-slate-600 border-slate-200" },
      { label: "No show", value: formatCount(noShowAppointments), className: "bg-rose-50 text-rose-700 border-rose-200" },
    ],
  };
}

async function loadAdminContent() {
  const [overviewResult, doctorsResult, departmentsResult, appointmentsResult, reportsResult] = await Promise.allSettled([
    requestJson<OverviewRecord>("/api/reports/admin-overview"),
    requestJson<DoctorRecord[]>("/api/doctors/admin/all"),
    requestJson<DepartmentRecord[]>("/api/departments"),
    requestJson<AppointmentRecord[]>("/api/appointments/me"),
    requestJson<{
      totalDoctors?: number;
      totalPatients?: number;
      totalAppointments?: number;
      pendingAppointments?: number;
      confirmedAppointments?: number;
      completedAppointments?: number;
      cancelledAppointments?: number;
      noShowAppointments?: number;
      totalDepartments?: number;
      appointments?: AppointmentRecord[];
    }>("/api/reports/appointments"),
  ]);

  const overview = overviewResult.status === "fulfilled" ? overviewResult.value.data : undefined;
  const doctors = doctorsResult.status === "fulfilled" ? doctorsResult.value.data ?? [] : [];
  const departments = departmentsResult.status === "fulfilled" ? departmentsResult.value.data ?? [] : [];
  const appointments = appointmentsResult.status === "fulfilled" ? appointmentsResult.value.data ?? [] : [];
  const reports = reportsResult.status === "fulfilled" ? reportsResult.value.data : undefined;
  const doctorCount = doctors.length;
  const departmentCount = departments.length;
  const appointmentCount = overview?.totalAppointments ?? appointments.length;
  const pendingAppointments = overview?.pendingAppointments ?? countAppointmentsByStatus(appointments, "pending");
  const confirmedAppointments = overview?.confirmedAppointments ?? countAppointmentsByStatus(appointments, "confirmed");
  const completedAppointments = overview?.completedAppointments ?? countAppointmentsByStatus(appointments, "completed");
  const cancelledAppointments = overview?.cancelledAppointments ?? countAppointmentsByStatus(appointments, "cancelled");
  const noShowAppointments = overview?.noShowAppointments ?? countAppointmentsByStatus(appointments, "no_show");
  const reportAppointmentCount = reports?.totalAppointments ?? appointmentCount;
  const reportPendingAppointments = reports?.pendingAppointments ?? pendingAppointments;
  const reportConfirmedAppointments = reports?.confirmedAppointments ?? confirmedAppointments;
  const reportCompletedAppointments = reports?.completedAppointments ?? completedAppointments;
  const reportCancelledAppointments = reports?.cancelledAppointments ?? cancelledAppointments;
  const reportNoShowAppointments = reports?.noShowAppointments ?? noShowAppointments;
  const reportTotalDoctors = reports?.totalDoctors ?? 0;
  const reportTotalPatients = reports?.totalPatients ?? 0;
  const reportTotalDepartments = reports?.totalDepartments ?? 0;
  const reportAppointments = reports?.appointments;

  const doctorsError =
    doctorsResult.status === "rejected"
      ? doctorsResult.reason instanceof Error
        ? doctorsResult.reason.message
        : "Failed to load doctors"
      : "";
  const departmentsError =
    departmentsResult.status === "rejected"
      ? departmentsResult.reason instanceof Error
        ? departmentsResult.reason.message
        : "Failed to load departments"
      : "";
  const appointmentsError =
    appointmentsResult.status === "rejected"
      ? appointmentsResult.reason instanceof Error
        ? appointmentsResult.reason.message
        : "Failed to load appointments"
      : "";
  const reportsError =
    reportsResult.status === "rejected"
      ? reportsResult.reason instanceof Error
        ? reportsResult.reason.message
        : "Failed to load reports"
      : "";
  const overviewError =
    overviewResult.status === "rejected"
      ? overviewResult.reason instanceof Error
        ? overviewResult.reason.message
        : "Failed to load overview"
      : "";

  return {
    stats: [
      { label: "Doctors", value: formatCount(doctorCount), detail: "Live doctor records available." },
      { label: "Departments", value: formatCount(departmentCount), detail: "Departments loaded from the backend." },
      { label: "Appointments", value: formatCount(appointmentCount), detail: "Appointments tracked in the system." },
      { label: "Pending", value: formatCount(pendingAppointments), detail: "Appointments waiting for review." },
    ],
    highlights: [
      `The admin overview currently tracks ${doctorCount} doctor${doctorCount === 1 ? "" : "s"} and ${departmentCount} department${departmentCount === 1 ? "" : "s"}.`,
      `The live appointment count is ${appointmentCount}.`,
      ...(overviewError ? [`Overview feed: ${overviewError}`] : []),
    ],
    nextSteps: [
      "Mount real doctor, patient, appointment, and report tables into this admin shell.",
      "Add search, filters, and actions for clinic operations next.",
    ],
    doctors,
    departments,
    appointments,
    doctorsError,
    departmentsError,
    appointmentsError,
    reportStats: [
      { label: "Total doctors", value: formatCount(reportTotalDoctors), detail: "Doctors included in reporting." },
      { label: "Total patients", value: formatCount(reportTotalPatients), detail: "Patient records included in reporting." },
      { label: "Total departments", value: formatCount(reportTotalDepartments), detail: "Department totals included in reporting." },
      { label: "Total appointments", value: formatCount(reportAppointmentCount), detail: "Appointments tracked in analytics." },
      { label: "Pending appointments", value: formatCount(reportPendingAppointments), detail: "Appointments waiting to be reviewed." },
      { label: "Confirmed appointments", value: formatCount(reportConfirmedAppointments), detail: "Appointments ready for visit." },
      { label: "Completed appointments", value: formatCount(reportCompletedAppointments), detail: "Appointments finished successfully." },
      { label: "Cancelled appointments", value: formatCount(reportCancelledAppointments), detail: "Appointments cancelled before completion." },
      { label: "No-show appointments", value: formatCount(reportNoShowAppointments), detail: "Appointments missed by patients." },
    ],
    reportHighlights: buildReportSummary({
      totalAppointments: reportAppointmentCount,
      completedAppointments: reportCompletedAppointments,
      cancelledAppointments: reportCancelledAppointments,
      totalDoctors: reportTotalDoctors,
      totalPatients: reportTotalPatients,
      totalDepartments: departmentCount,
      overviewError: reportsError,
    }),
    reportAppointments,
    appointmentStatusSummary: [
      { label: "Pending", value: formatCount(pendingAppointments), className: "bg-amber-50 text-amber-700 border-amber-200" },
      { label: "Confirmed", value: formatCount(confirmedAppointments), className: "bg-sky-50 text-sky-700 border-sky-200" },
      { label: "Completed", value: formatCount(completedAppointments), className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      { label: "Cancelled", value: formatCount(cancelledAppointments), className: "bg-slate-100 text-slate-600 border-slate-200" },
      { label: "No show", value: formatCount(noShowAppointments), className: "bg-rose-50 text-rose-700 border-rose-200" },
    ],
    reportStatusSummary: [
      { label: "Pending", value: formatCount(reportPendingAppointments), className: "bg-amber-50 text-amber-700 border-amber-200" },
      { label: "Confirmed", value: formatCount(reportConfirmedAppointments), className: "bg-sky-50 text-sky-700 border-sky-200" },
      { label: "Completed", value: formatCount(reportCompletedAppointments), className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      { label: "Cancelled", value: formatCount(reportCancelledAppointments), className: "bg-slate-100 text-slate-600 border-slate-200" },
      { label: "No show", value: formatCount(reportNoShowAppointments), className: "bg-rose-50 text-rose-700 border-rose-200" },
    ],
    reportError: reportsError,
  };
}

async function loadSuperAdminContent() {
  const [overviewResult, doctorsResult, departmentsResult, appointmentsResult, reportsResult] = await Promise.allSettled([
    requestJson<OverviewRecord>("/api/reports/admin-overview"),
    requestJson<DoctorRecord[]>("/api/doctors/admin/all"),
    requestJson<DepartmentRecord[]>("/api/departments"),
    requestJson<AppointmentRecord[]>("/api/appointments/me"),
    requestJson<{
      totalDoctors?: number;
      totalPatients?: number;
      totalAppointments?: number;
      pendingAppointments?: number;
      confirmedAppointments?: number;
      completedAppointments?: number;
      cancelledAppointments?: number;
      noShowAppointments?: number;
      totalDepartments?: number;
      appointments?: AppointmentRecord[];
    }>("/api/reports/appointments"),
  ]);

  const overview = overviewResult.status === "fulfilled" ? overviewResult.value.data : undefined;
  const doctors = doctorsResult.status === "fulfilled" ? doctorsResult.value.data ?? [] : [];
  const departments = departmentsResult.status === "fulfilled" ? departmentsResult.value.data ?? [] : [];
  const appointments = appointmentsResult.status === "fulfilled" ? appointmentsResult.value.data ?? [] : [];
  const reports = reportsResult.status === "fulfilled" ? reportsResult.value.data : undefined;
  const doctorCount = doctors.length;
  const departmentCount = departments.length;
  const appointmentCount = overview?.totalAppointments ?? appointments.length;
  const pendingDoctors = doctors.filter((doctor) => doctor.profileStatus === "pending").length;
  const pendingAppointments = overview?.pendingAppointments ?? countAppointmentsByStatus(appointments, "pending");
  const confirmedAppointments = overview?.confirmedAppointments ?? countAppointmentsByStatus(appointments, "confirmed");
  const completedAppointments = overview?.completedAppointments ?? countAppointmentsByStatus(appointments, "completed");
  const cancelledAppointments = overview?.cancelledAppointments ?? countAppointmentsByStatus(appointments, "cancelled");
  const noShowAppointments = overview?.noShowAppointments ?? countAppointmentsByStatus(appointments, "no_show");
  const clinicCount = countUniqueClinics(doctors, departments);
  const reportAppointmentCount = reports?.totalAppointments ?? appointmentCount;
  const reportCompletedAppointments = reports?.completedAppointments ?? completedAppointments;
  const reportCancelledAppointments = reports?.cancelledAppointments ?? cancelledAppointments;
  const reportPendingAppointments = reports?.pendingAppointments ?? pendingAppointments;
  const reportConfirmedAppointments = reports?.confirmedAppointments ?? confirmedAppointments;
  const reportNoShowAppointments = reports?.noShowAppointments ?? noShowAppointments;
  const reportTotalDoctors = reports?.totalDoctors ?? 0;
  const reportTotalPatients = reports?.totalPatients ?? 0;
  const reportTotalDepartments = reports?.totalDepartments ?? 0;
  const reportAppointments = reports?.appointments;
  const doctorsError =
    doctorsResult.status === "rejected"
      ? doctorsResult.reason instanceof Error
        ? doctorsResult.reason.message
        : "Failed to load doctors"
      : "";
  const departmentsError =
    departmentsResult.status === "rejected"
      ? departmentsResult.reason instanceof Error
        ? departmentsResult.reason.message
        : "Failed to load departments"
      : "";
  const appointmentsError =
    appointmentsResult.status === "rejected"
      ? appointmentsResult.reason instanceof Error
        ? appointmentsResult.reason.message
        : "Failed to load appointments"
      : "";
  const overviewError =
    overviewResult.status === "rejected"
      ? overviewResult.reason instanceof Error
        ? overviewResult.reason.message
        : "Failed to load overview"
      : "";
  const reportsError =
    reportsResult.status === "rejected"
      ? reportsResult.reason instanceof Error
        ? reportsResult.reason.message
        : "Failed to load reports"
      : "";

  return {
    stats: [
      { label: "Total clinics", value: formatCount(clinicCount), detail: "Clinic records discovered from live data." },
      { label: "Total doctors", value: formatCount(doctorCount), detail: "Live doctor records loaded." },
      { label: "Total departments", value: formatCount(departmentCount), detail: "Department records loaded." },
      { label: "Total appointments", value: formatCount(appointmentCount), detail: "Total tracked appointments." },
      { label: "Pending doctors", value: formatCount(pendingDoctors), detail: "Doctors waiting for approval." },
    ],
    highlights: buildRecentActivitySummary({
      pendingDoctors,
      departments,
      appointments,
      overviewError,
    }),
    nextSteps: [],
    reportStats: [
      { label: "Total appointments", value: formatCount(reportAppointmentCount), detail: "Appointments tracked in analytics." },
      { label: "Total doctors", value: formatCount(reportTotalDoctors), detail: "Doctors included in reporting." },
      { label: "Total patients", value: formatCount(reportTotalPatients), detail: "Patient records included in reporting." },
      { label: "Total departments", value: formatCount(reportTotalDepartments), detail: "Department totals included in reporting." },
      { label: "Pending appointments", value: formatCount(reportPendingAppointments), detail: "Appointments waiting for review." },
      { label: "Confirmed appointments", value: formatCount(reportConfirmedAppointments), detail: "Appointments ready for visit." },
      { label: "Completed appointments", value: formatCount(reportCompletedAppointments), detail: "Appointments finished successfully." },
      { label: "Cancelled appointments", value: formatCount(reportCancelledAppointments), detail: "Appointments cancelled before completion." },
      { label: "No-show appointments", value: formatCount(reportNoShowAppointments), detail: "Appointments missed by patients." },
    ],
    reportHighlights: buildReportSummary({
      totalAppointments: reportAppointmentCount,
      completedAppointments: reportCompletedAppointments,
      cancelledAppointments: reportCancelledAppointments,
      totalDoctors: reportTotalDoctors,
      totalPatients: reportTotalPatients,
      totalDepartments: reportTotalDepartments,
      overviewError: reportsError,
    }),
    reportAppointments,
    doctors,
    departments,
    appointments,
    doctorsError,
    departmentsError,
    appointmentsError,
    appointmentStatusSummary: [
      { label: "Pending", value: formatCount(pendingAppointments), className: "bg-amber-50 text-amber-700 border-amber-200" },
      { label: "Confirmed", value: formatCount(confirmedAppointments), className: "bg-sky-50 text-sky-700 border-sky-200" },
      { label: "Completed", value: formatCount(completedAppointments), className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      { label: "Cancelled", value: formatCount(cancelledAppointments), className: "bg-slate-100 text-slate-600 border-slate-200" },
      { label: "No show", value: formatCount(noShowAppointments), className: "bg-rose-50 text-rose-700 border-rose-200" },
    ],
    reportStatusSummary: [
      { label: "Pending", value: formatCount(reportPendingAppointments), className: "bg-amber-50 text-amber-700 border-amber-200" },
      { label: "Confirmed", value: formatCount(reportConfirmedAppointments), className: "bg-sky-50 text-sky-700 border-sky-200" },
      { label: "Completed", value: formatCount(reportCompletedAppointments), className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      { label: "Cancelled", value: formatCount(reportCancelledAppointments), className: "bg-slate-100 text-slate-600 border-slate-200" },
      { label: "No show", value: formatCount(reportNoShowAppointments), className: "bg-rose-50 text-rose-700 border-rose-200" },
    ],
    reportError: reportsError,
  };
}

async function loadDashboardContent(role: AuthRole): Promise<DashboardContent> {
  switch (role) {
    case "patient":
      return loadPatientContent();
    case "doctor":
      return loadDoctorContent();
    case "clinic_admin":
      return loadAdminContent();
    case "super_admin":
      return loadSuperAdminContent();
  }
}

export function DashboardRoutePage({ config }: DashboardRoutePageProps) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [content, setContent] = useState<DashboardContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCancellingId, setIsCancellingId] = useState<string | null>(null);
  const [isUpdatingAppointmentId, setIsUpdatingAppointmentId] = useState<string | null>(null);
  const [isUpdatingDoctorId, setIsUpdatingDoctorId] = useState<string | null>(null);
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);
  const [isDeletingAvailabilityId, setIsDeletingAvailabilityId] = useState<string | null>(null);
  const [isSavingDepartment, setIsSavingDepartment] = useState(false);
  const [isSavingDoctor, setIsSavingDoctor] = useState(false);
  const [isDeletingDepartmentId, setIsDeletingDepartmentId] = useState<string | null>(null);
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);
  const [editingAvailabilityId, setEditingAvailabilityId] = useState<string | null>(null);
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
  const [isDoctorFormOpen, setIsDoctorFormOpen] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [doctorCreationMessage, setDoctorCreationMessage] = useState("");
  const [departmentForm, setDepartmentForm] = useState({ name: "", description: "" });
  const [doctorCreationForm, setDoctorCreationForm] = useState<DoctorCreationFormState>({
    name: "",
    email: "",
    password: "",
    departmentId: "",
    specialization: "General Practice",
    experienceYears: "0",
    consultationFee: "0",
    bio: "",
    status: "pending",
  });
  const [availabilityForm, setAvailabilityForm] = useState({
    doctorId: "",
    dayOfWeek: "monday",
    startTime: "",
    endTime: "",
    slotDurationMinutes: "30",
  });
  const sectionNavItems = useMemo(() => config.navItems.filter((item) => !item.href), [config.navItems]);
  const [activeSection, setActiveSection] = useState(() => sectionNavItems[0]?.label ?? "Overview");
  const [appointmentsMessage, setAppointmentsMessage] = useState("");
  const [doctorsMessage, setDoctorsMessage] = useState("");
  const [departmentsMessage, setDepartmentsMessage] = useState("");
  const [patientDoctorsSearchQuery, setPatientDoctorsSearchQuery] = useState("");
  const [patientDoctorsDepartment, setPatientDoctorsDepartment] = useState("all");
  const [patientDoctorsSortBy, setPatientDoctorsSortBy] = useState<"featured" | "experience_desc" | "fee_asc" | "fee_desc">(
    "featured",
  );
  const [appointmentsError, setAppointmentsError] = useState("");
  const [doctorsError, setDoctorsError] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");
  const [departmentsError, setDepartmentsError] = useState("");
  const [doctorCreationError, setDoctorCreationError] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function initializeDashboard() {
      try {
        const meResponse = await getCurrentUser();
        const currentUser = meResponse.data;

        if (!currentUser) {
          router.replace("/login");
          return;
        }

        if (!active) {
          return;
        }

        const expectedRoute = rolePathMap[config.expectedRole];
        const currentRoute = rolePathMap[currentUser.role];

        if (currentRoute !== expectedRoute) {
          router.replace(currentRoute);
          return;
        }

        setUser(currentUser);

        const roleContent = await loadDashboardContent(currentUser.role);
        if (!active) {
          return;
        }

        setContent(roleContent);
      } catch (fetchError) {
        const message = fetchError instanceof Error ? fetchError.message : "Failed to load dashboard";
        if (message.toLowerCase().includes("unauthorized") || message.toLowerCase().includes("not found")) {
          router.replace("/login");
          return;
        }

        if (active) {
          setError(message);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    initializeDashboard();

    return () => {
      active = false;
    };
  }, [config.expectedRole, router]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const sectionParam = searchParams.get("section") ?? "";
    const defaultSection = sectionNavItems[0]?.label ?? "Overview";
    const initialSection = sectionNavItems.some((item) => item.label === sectionParam) ? sectionParam : defaultSection;
    setActiveSection(initialSection);
  }, [config.expectedRole, sectionNavItems]);

  useEffect(() => {
    if (user?.role === "doctor" && content?.doctorProfileId) {
      setAvailabilityForm((current) =>
        current.doctorId ? current : { ...current, doctorId: content.doctorProfileId ?? "" },
      );
    }
  }, [content?.doctorProfileId, user?.role]);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logoutUser();
      router.replace("/login");
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Logout failed");
    } finally {
      setIsLoggingOut(false);
    }
  }

  function renderSuperAdminHero() {
    if (!user || user.role !== "super_admin" || !content) {
      return null;
    }

    const doctorCount = content.doctors?.length ?? 0;
    const pendingDoctors = content.doctors?.filter((doctor) => doctor.profileStatus === "pending").length ?? 0;
    const approvedDoctors = content.doctors?.filter((doctor) => doctor.profileStatus === "approved").length ?? 0;
    const rejectedDoctors = content.doctors?.filter((doctor) => doctor.profileStatus === "rejected").length ?? 0;
    const departmentCount = content.departments?.length ?? 0;
    const activeDepartments = content.departments?.filter((department) => department.isActive !== false).length ?? 0;
    const inactiveDepartments = Math.max(departmentCount - activeDepartments, 0);
    const appointmentCount = content.appointments?.length ?? 0;
    const pendingAppointments = content.appointmentStatusSummary?.find((item) => item.label === "Pending")?.value ?? "0";
    const confirmedAppointments = content.appointmentStatusSummary?.find((item) => item.label === "Confirmed")?.value ?? "0";
    const completedAppointments = content.appointmentStatusSummary?.find((item) => item.label === "Completed")?.value ?? "0";
    const cancelledAppointments = content.appointmentStatusSummary?.find((item) => item.label === "Cancelled")?.value ?? "0";
    const totalPatients = content.reportStats?.find((item) => item.label === "Patients")?.value ?? "0";
    const totalAppointments = content.reportStats?.find((item) => item.label === "Total appointments")?.value ?? formatCount(appointmentCount);

    const heroMap: Record<
      string,
      {
        label: string;
        title: string;
        subtitle: string;
        cards: SectionHeroCard[];
      }
    > = {
      Overview: {
        label: "Overview",
        title: "Live clinic overview and records",
        subtitle: "Quick summary of clinics, doctors, departments, appointments, and recent platform activity.",
        cards: [
          { title: "Total clinics", text: "Live clinic coverage across the platform." },
          { title: "Total doctors", text: "Approved and pending doctor records." },
          { title: "Pending doctors", text: "Doctor profiles waiting for review." },
        ],
      },
      Clinics: {
        label: "Clinics",
        title: "Manage clinic visibility and directory data",
        subtitle: "Clinic records and publishing controls will live here.",
        cards: [
          { title: "Clinic directory", text: "Add and review clinic records when the clinic module is connected." },
          { title: "Publishing controls", text: "Control which clinic profiles are visible to the platform." },
          { title: "Onboarding flow", text: "Track pending clinics and approval steps in one place." },
        ],
      },
      Doctors: {
        label: "Doctors",
        title: "Doctor approval and visibility management",
        subtitle: "Manage pending, approved, and hidden doctor profiles.",
        cards: [
          { title: `${pendingDoctors} pending`, text: "Profiles waiting for approval." },
          { title: `${approvedDoctors} approved`, text: "Profiles visible on the public list." },
          { title: `${rejectedDoctors} rejected`, text: "Profiles hidden from publication." },
        ],
      },
      Departments: {
        label: "Departments",
        title: "Department management",
        subtitle: "Create, edit, and delete clinic specialties from this section.",
        cards: [
          { title: `${departmentCount} total`, text: "Department records loaded from the backend." },
          { title: `${activeDepartments} active`, text: "Departments currently enabled." },
          { title: `${inactiveDepartments} inactive`, text: "Departments hidden or disabled." },
        ],
      },
      Appointments: {
        label: "Appointments",
        title: "Appointment records",
        subtitle: "View live appointment activity with patient, doctor, time, and status details.",
        cards: [
          { title: `${appointmentCount} total`, text: "Tracked appointment records in the system." },
          { title: `${pendingAppointments} pending`, text: "Appointments waiting on action." },
          { title: `${confirmedAppointments} confirmed`, text: "Appointments ready for the next step." },
        ],
      },
      Users: {
        label: "Users",
        title: "Manage platform users and roles",
        subtitle: "User governance and account management will be connected here.",
        cards: [
          { title: "Account directory", text: "Review platform accounts and role assignments." },
          { title: "Access controls", text: "Manage visibility and permissions at the platform level." },
          { title: "Audit trail", text: "Track user changes and account activity over time." },
        ],
      },
      Subscriptions: {
        label: "Subscriptions",
        title: "Track plans and billing status",
        subtitle: "Subscription management and plan usage will appear here.",
        cards: [
          { title: "Plan overview", text: "See active and upcoming plans across the platform." },
          { title: "Billing status", text: "Review account payment states and renewal timing." },
          { title: "Usage summary", text: "Summarize seat and feature usage when connected." },
        ],
      },
      Reports: {
        label: "Reports",
        title: "Reports and analytics",
        subtitle: "Analytics cards show current totals and appointment status mix only.",
        cards: [
          { title: `${totalAppointments} appointments`, text: "Analytics overview for the live appointment feed." },
          { title: `${completedAppointments} completed`, text: "Closed appointments tracked in reporting." },
          { title: `${cancelledAppointments} cancelled`, text: "Appointments removed from active flow." },
        ],
      },
      Settings: {
        label: "Settings",
        title: "Platform preferences and security",
        subtitle: "Configure platform settings, notifications, and governance here.",
        cards: [
          { title: "General settings", text: "Set brand, locale, and platform defaults." },
          { title: "Security", text: "Review access, authentication, and safety settings." },
          { title: "Notifications", text: "Manage system alerts and message delivery preferences." },
        ],
      },
    };

    const section = heroMap[activeSection] ?? heroMap.Overview;

    return (
      <section className="bg-slate-50 px-6 pb-8 text-slate-900">
        <div className="mx-auto max-w-[1600px]">
          <SectionHero label={section.label} title={section.title} subtitle={section.subtitle} cards={section.cards} />
        </div>
      </section>
    );
  }

  async function refreshDashboardContent(currentUser: AuthUser) {
    const nextContent = await loadDashboardContent(currentUser.role);
    setContent(nextContent);
  }

  function resetDoctorForm() {
    setDoctorCreationForm({
      name: "",
      email: "",
      password: "",
      departmentId: "",
      specialization: "General Practice",
      experienceYears: "0",
      consultationFee: "0",
      bio: "",
      status: "pending",
    });
    setEditingDoctorId(null);
  }

  function openDoctorCreateForm() {
    if (!user) {
      return;
    }

    const basePath = user.role === "super_admin" ? "/superadmin" : "/admin";
    router.push(`${basePath}/doctors/new`);
  }

  function openDoctorEditForm(doctor: DoctorRecord) {
    if (!user || !doctor._id) {
      return;
    }

    const basePath = user.role === "super_admin" ? "/superadmin" : "/admin";
    router.push(`${basePath}/doctors/${doctor._id}/edit`);
  }

  function closeDoctorForm() {
    setIsDoctorFormOpen(false);
    resetDoctorForm();
  }

  async function handleDoctorCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      return;
    }

    setDoctorCreationMessage("");
    setDoctorCreationError("");
    setIsSavingDoctor(true);

    try {
      if (!editingDoctorId && !doctorCreationForm.password.trim()) {
        throw new Error("Temporary password is required");
      }

      const payload = {
        name: doctorCreationForm.name.trim(),
        email: doctorCreationForm.email.trim(),
        ...(doctorCreationForm.password.trim() ? { password: doctorCreationForm.password.trim() } : {}),
        departmentId: doctorCreationForm.departmentId || undefined,
        specialization: doctorCreationForm.specialization.trim() || "General Practice",
        experienceYears: Number(doctorCreationForm.experienceYears || 0),
        consultationFee: Number(doctorCreationForm.consultationFee || 0),
        bio: doctorCreationForm.bio.trim(),
        status: doctorCreationForm.status,
      };

      if (editingDoctorId) {
        await requestJson(`/api/doctors/${editingDoctorId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setDoctorCreationMessage("Doctor account updated successfully.");
      } else {
        await requestJson("/api/doctors", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setDoctorCreationMessage("Doctor account created successfully.");
      }

      closeDoctorForm();

      await refreshDashboardContent(user);
    } catch (doctorCreateError) {
      setDoctorCreationError(
        doctorCreateError instanceof Error ? doctorCreateError.message : "Failed to create doctor account",
      );
    } finally {
      setIsSavingDoctor(false);
    }
  }

  async function handleDoctorApprovalAction(doctorId?: string, action?: "approve" | "reject" | "unpublish") {
    if (!doctorId || !user) {
      return;
    }

    setDoctorsMessage("");
    setDoctorsError("");
    setIsUpdatingDoctorId(doctorId);

    try {
      const endpoint =
        action === "approve"
          ? `/api/doctors/${doctorId}/approve`
          : action === "reject"
            ? `/api/doctors/${doctorId}/reject`
            : `/api/doctors/${doctorId}/unpublish`;

      await requestJson(endpoint, { method: "PATCH" });
      setDoctorsMessage(
        action === "approve"
          ? "Doctor approved successfully."
          : action === "reject"
            ? "Doctor rejected successfully."
            : "Doctor unpublished successfully.",
      );

      await refreshDashboardContent(user);
    } catch (doctorActionError) {
      setDoctorsError(doctorActionError instanceof Error ? doctorActionError.message : "Failed to update doctor");
    } finally {
      setIsUpdatingDoctorId(null);
    }
  }

  function startDepartmentEdit(department: DepartmentRecord) {
    setDepartmentsMessage("");
    setDepartmentsError("");
    setEditingDepartmentId(department._id ?? null);
    setDepartmentForm({
      name: department.name ?? "",
      description: department.description ?? "",
    });
  }

  function cancelDepartmentEdit() {
    setEditingDepartmentId(null);
    setDepartmentForm({ name: "", description: "" });
  }

  async function handleDepartmentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      return;
    }

    setDepartmentsMessage("");
    setDepartmentsError("");
    setIsSavingDepartment(true);

    try {
      const resolvedClinicId =
        resolveId(content?.departments?.find((department) => resolveId(department.clinicId))) ||
        resolveId(content?.doctors?.find((doctor) => resolveId(doctor.clinicId)));

      if (!resolvedClinicId) {
        throw new Error("Unable to determine clinic id for department creation");
      }

      const payload = {
        clinicId: resolvedClinicId,
        name: departmentForm.name.trim(),
        description: departmentForm.description.trim(),
      };

      if (editingDepartmentId) {
        await requestJson(`/api/departments/${editingDepartmentId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setDepartmentsMessage("Department updated successfully.");
      } else {
        await requestJson("/api/departments", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setDepartmentsMessage("Department created successfully.");
      }

      setDepartmentForm({ name: "", description: "" });
      setEditingDepartmentId(null);
      await refreshDashboardContent(user);
    } catch (departmentSubmitError) {
      setDepartmentsError(
        departmentSubmitError instanceof Error ? departmentSubmitError.message : "Failed to save department",
      );
    } finally {
      setIsSavingDepartment(false);
    }
  }

  async function handleDepartmentDelete(departmentId?: string) {
    if (!departmentId || !user) {
      return;
    }

    setDepartmentsMessage("");
    setDepartmentsError("");
    setIsDeletingDepartmentId(departmentId);

    try {
      await requestJson(`/api/departments/${departmentId}`, {
        method: "DELETE",
      });
      setDepartmentsMessage("Department deleted successfully.");
      if (editingDepartmentId === departmentId) {
        cancelDepartmentEdit();
      }
      await refreshDashboardContent(user);
    } catch (departmentDeleteError) {
      setDepartmentsError(
        departmentDeleteError instanceof Error ? departmentDeleteError.message : "Failed to delete department",
      );
    } finally {
      setIsDeletingDepartmentId(null);
    }
  }

  async function handleCancelAppointment(appointmentId?: string) {
    if (!appointmentId) {
      return;
    }

    setAppointmentsMessage("");
    setAppointmentsError("");
    setIsCancellingId(appointmentId);

    try {
      await requestJson(`/api/appointments/${appointmentId}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ cancellationReason: "Cancelled from patient dashboard" }),
      });

      setAppointmentsMessage("Appointment cancelled successfully.");
      setContent((currentContent) => {
        if (!currentContent?.appointments) {
          return currentContent;
        }

        return {
          ...currentContent,
          appointments: currentContent.appointments.map((appointment) =>
            appointment._id === appointmentId ? { ...appointment, status: "cancelled" } : appointment,
          ),
        };
      });
    } catch (cancelError) {
      setAppointmentsError(cancelError instanceof Error ? cancelError.message : "Failed to cancel appointment");
    } finally {
      setIsCancellingId(null);
    }
  }

  async function handleDoctorAppointmentAction(appointmentId?: string, action?: "confirmed" | "completed" | "no_show" | "cancelled") {
    if (!appointmentId || !user) {
      return;
    }

    setAppointmentsMessage("");
    setAppointmentsError("");
    setIsUpdatingAppointmentId(appointmentId);

    try {
      if (action === "cancelled") {
        await requestJson(`/api/appointments/${appointmentId}/cancel`, {
          method: "PATCH",
          body: JSON.stringify({ cancellationReason: "Cancelled from doctor dashboard" }),
        });
        setAppointmentsMessage("Appointment cancelled successfully.");
      } else if (action) {
        await requestJson(`/api/appointments/${appointmentId}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: action }),
        });
        setAppointmentsMessage(`Appointment marked as ${action.replace("_", " ")}.`);
      }

      await refreshDashboardContent(user);
    } catch (updateError) {
      setAppointmentsError(updateError instanceof Error ? updateError.message : "Failed to update appointment");
    } finally {
      setIsUpdatingAppointmentId(null);
    }
  }

  function startAvailabilityEdit(availability: AvailabilityRecord) {
    setAvailabilityMessage("");
    setAvailabilityError("");
    setEditingAvailabilityId(availability._id ?? null);
    setAvailabilityForm({
      doctorId: resolveId(availability.doctorId) || (content?.doctorProfileId ?? ""),
      dayOfWeek: availability.dayOfWeek ?? "monday",
      startTime: availability.startTime ?? "",
      endTime: availability.endTime ?? "",
      slotDurationMinutes: String(availability.slotDurationMinutes ?? 30),
    });
  }

  function cancelAvailabilityEdit() {
    setEditingAvailabilityId(null);
    setAvailabilityForm({
      doctorId: content?.doctorProfileId ?? "",
      dayOfWeek: "monday",
      startTime: "",
      endTime: "",
      slotDurationMinutes: "30",
    });
  }

  async function handleAvailabilitySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      return;
    }

    const doctorId = availabilityForm.doctorId || content?.doctorProfileId || "";
    if (!doctorId) {
      setAvailabilityError("Doctor profile not found");
      return;
    }

    setAvailabilityMessage("");
    setAvailabilityError("");
    setIsSavingAvailability(true);

    try {
      const payload = {
        doctorId,
        dayOfWeek: availabilityForm.dayOfWeek,
        startTime: availabilityForm.startTime.trim(),
        endTime: availabilityForm.endTime.trim(),
        slotDurationMinutes: Number(availabilityForm.slotDurationMinutes || 30),
      };

      if (editingAvailabilityId) {
        await requestJson(`/api/availability/${editingAvailabilityId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setAvailabilityMessage("Availability updated successfully.");
      } else {
        await requestJson("/api/availability", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setAvailabilityMessage("Availability created successfully.");
      }

      cancelAvailabilityEdit();
      await refreshDashboardContent(user);
    } catch (availabilitySubmitError) {
      setAvailabilityError(
        availabilitySubmitError instanceof Error ? availabilitySubmitError.message : "Failed to save availability",
      );
    } finally {
      setIsSavingAvailability(false);
    }
  }

  async function handleAvailabilityDelete(availabilityId?: string) {
    if (!availabilityId || !user) {
      return;
    }

    setAvailabilityMessage("");
    setAvailabilityError("");
    setIsDeletingAvailabilityId(availabilityId);

    try {
      await requestJson(`/api/availability/${availabilityId}`, {
        method: "DELETE",
      });
      setAvailabilityMessage("Availability deleted successfully.");
      if (editingAvailabilityId === availabilityId) {
        cancelAvailabilityEdit();
      }
      await refreshDashboardContent(user);
    } catch (availabilityDeleteError) {
      setAvailabilityError(
        availabilityDeleteError instanceof Error ? availabilityDeleteError.message : "Failed to delete availability",
      );
    } finally {
      setIsDeletingAvailabilityId(null);
    }
  }

  const filteredPatientDoctors = useMemo(() => {
    if (user?.role !== "patient") {
      return [];
    }

    const doctors = content?.doctors ?? [];
    let nextDoctors = doctors;

    if (patientDoctorsDepartment !== "all") {
      nextDoctors = nextDoctors.filter((doctor) => resolveDoctorDepartmentName(doctor) === patientDoctorsDepartment);
    }

    if (patientDoctorsSearchQuery.trim()) {
      nextDoctors = nextDoctors.filter((doctor) => matchesDoctorSearch(doctor, patientDoctorsSearchQuery));
    }

    const sortedDoctors = [...nextDoctors].sort((left, right) => {
      const leftExperience = left.experienceYears ?? -1;
      const rightExperience = right.experienceYears ?? -1;
      const leftFee = left.consultationFee ?? Number.POSITIVE_INFINITY;
      const rightFee = right.consultationFee ?? Number.POSITIVE_INFINITY;

      switch (patientDoctorsSortBy) {
        case "experience_desc":
          return rightExperience - leftExperience;
        case "fee_asc":
          return leftFee - rightFee;
        case "fee_desc":
          return rightFee - leftFee;
        default:
          return rightExperience - leftExperience || formatDoctorName(left).localeCompare(formatDoctorName(right));
      }
    });

    return sortedDoctors;
  }, [content?.doctors, patientDoctorsDepartment, patientDoctorsSearchQuery, patientDoctorsSortBy, user?.role]);

  const patientDoctorDepartments = useMemo(() => {
    const names = new Set<string>();

    (content?.doctors ?? []).forEach((doctor) => {
      const departmentName = resolveDoctorDepartmentName(doctor);
      if (departmentName !== "Department unavailable") {
        names.add(departmentName);
      }
    });

    return [...names].sort((left, right) => left.localeCompare(right));
  }, [content?.doctors]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
        <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center">
          <div className="rounded-3xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
            <div className="mx-auto size-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />
            <p className="mt-4 text-sm font-medium text-slate-600">Loading your dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !user) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
        <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center">
          <div className="rounded-3xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Dashboard error</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">Unable to load dashboard</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">{error}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => router.refresh()}
                className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => router.replace("/login")}
                className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Go to login
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!user || !content) {
    return null;
  }

    return (
      <DashboardShell
          roleLabel={config.roleLabel}
          accent={config.accent}
          navItems={config.navItems}
          title={config.title}
          subtitle={config.subtitle}
        stats={content.stats}
        activeNavLabel={activeSection}
        statusChips={
          user.role === "clinic_admin" || user.role === "super_admin" ? content.appointmentStatusSummary : undefined
        }
        actions={[
          { label: config.primaryActionLabel, href: "#", variant: "primary" },
          { label: config.secondaryActionLabel, href: "#", variant: "secondary" },
        ]}
        highlights={content.highlights}
        nextSteps={content.nextSteps}
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }}
          onNavItemSelect={setActiveSection}
          onLogout={handleLogout}
          isLoggingOut={isLoggingOut}
      >

      {user.role === "patient" ? (
        <section className="bg-slate-50 px-6 pb-10 text-slate-900">
          <div className="mx-auto max-w-[1600px]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              {activeSection === "Doctors" ? (
                <>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Doctors</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight">Browse available doctors</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Live public doctor profiles pulled from <span className="font-medium text-slate-700">/api/doctors</span>.
                      </p>
                    </div>
                    <Link
                      href="/doctors"
                      className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold !text-white transition hover:bg-blue-700 hover:!text-white"
                      style={{ color: "#ffffff" }}
                    >
                      Open doctors page
                    </Link>
                  </div>

                  {content.doctorsError ? (
                    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {content.doctorsError}
                    </div>
                  ) : content.doctors === undefined ? (
                    <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 px-6 py-10 text-center">
                      <div className="mx-auto size-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />
                      <p className="mt-4 text-sm font-medium text-slate-600">Loading doctors...</p>
                    </div>
                  ) : (
                    <>
                      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_220px]">
                        <label className="space-y-2">
                          <span className="text-sm font-medium text-slate-700">Search doctors</span>
                          <input
                            type="text"
                            value={patientDoctorsSearchQuery}
                            onChange={(event) => setPatientDoctorsSearchQuery(event.target.value)}
                            placeholder="Search by name, specialization, department, or email"
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="text-sm font-medium text-slate-700">Department</span>
                          <select
                            value={patientDoctorsDepartment}
                            onChange={(event) => setPatientDoctorsDepartment(event.target.value)}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                          >
                            <option value="all">All departments</option>
                            {patientDoctorDepartments.map((departmentName) => (
                              <option key={departmentName} value={departmentName}>
                                {departmentName}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="space-y-2">
                          <span className="text-sm font-medium text-slate-700">Sort by</span>
                          <select
                            value={patientDoctorsSortBy}
                            onChange={(event) =>
                              setPatientDoctorsSortBy(
                                event.target.value as "featured" | "experience_desc" | "fee_asc" | "fee_desc",
                              )
                            }
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                          >
                            <option value="featured">Featured</option>
                            <option value="experience_desc">Experience high to low</option>
                            <option value="fee_asc">Fee low to high</option>
                            <option value="fee_desc">Fee high to low</option>
                          </select>
                        </label>
                      </div>

                      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        <span>
                          Showing <span className="font-semibold text-slate-950">{filteredPatientDoctors.length}</span> of{" "}
                          <span className="font-semibold text-slate-950">{content.doctors.length}</span> doctors
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setPatientDoctorsSearchQuery("");
                            setPatientDoctorsDepartment("all");
                            setPatientDoctorsSortBy("featured");
                          }}
                          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Reset filters
                        </button>
                      </div>

                      {filteredPatientDoctors.length === 0 ? (
                        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">No doctors</p>
                          <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
                            No doctors match the current filters
                          </h3>
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            Try clearing the search or changing the department filter.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {filteredPatientDoctors.map((doctor) => {
                        const doctorId = doctor._id ?? "";
                        const departmentName = resolveDoctorDepartmentName(doctor);
                        const availabilitySlots = doctorId ? content.availabilityByDoctorId?.[doctorId] ?? [] : [];

                        return (
                          <article
                            key={doctorId || `${typeof doctor.userId === "string" ? doctor.userId : doctor.userId?.email}-${doctor.specialization}`}
                            className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-950">{formatDoctorName(doctor)}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {typeof doctor.userId === "string" ? "Email unavailable" : doctor.userId?.email ?? "Email unavailable"}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                  Available
                                </span>
                                <Link
                                  href={doctorId ? `/doctors/${doctorId}` : "/doctors"}
                                  className="inline-flex items-center justify-center rounded-full bg-blue-600 px-3 py-2 text-xs font-semibold !text-white shadow-sm transition hover:bg-blue-700 hover:!text-white"
                                  style={{ color: "#ffffff" }}
                                >
                                  Book now
                                </Link>
                              </div>
                            </div>

                            <div className="mt-4 space-y-2 text-sm text-slate-600">
                              <div className="flex items-center justify-between gap-3">
                                <span>Specialization</span>
                                <span className="font-medium text-slate-900">{doctor.specialization ?? "General Practice"}</span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span>Department</span>
                                <span className="font-medium text-slate-900">{departmentName}</span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span>Consultation fee</span>
                                <span className="font-medium text-slate-900">{formatDoctorFee(doctor)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span>Experience</span>
                                <span className="font-medium text-slate-900">
                                  {doctor.experienceYears != null ? `${doctor.experienceYears} years` : "Not set"}
                                </span>
                              </div>
                            </div>

                            <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Availability</p>
                              {availabilitySlots.length > 0 ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {availabilitySlots.slice(0, 4).map((slot) => (
                                    <span
                                      key={slot._id}
                                      className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
                                    >
                                      {slot.dayOfWeek ?? "day"} • {slot.startTime ?? "--:--"} - {slot.endTime ?? "--:--"}
                                    </span>
                                  ))}
                                  {availabilitySlots.length > 4 ? (
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                      +{availabilitySlots.length - 4} more
                                    </span>
                                  ) : null}
                                </div>
                              ) : (
                                <p className="mt-2 text-sm text-slate-500">No availability slots published yet.</p>
                              )}
                            </div>

                            <div className="mt-5 flex flex-wrap gap-3">
                              <Link
                                href={doctorId ? `/doctors/${doctorId}` : "/doctors"}
                                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold !text-white shadow-sm transition hover:bg-blue-700 hover:!text-white"
                                style={{ color: "#ffffff" }}
                              >
                                View details
                              </Link>
                              <Link
                                href="/doctors"
                                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                              >
                                Book appointment
                              </Link>
                            </div>
                          </article>
                        );
                      })}
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Appointments</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight">Your live appointment timeline</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Pulled directly from <span className="font-medium text-slate-700">/api/appointments/me</span>.
                      </p>
                    </div>
                    {appointmentsMessage ? (
                      <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                        {appointmentsMessage}
                      </div>
                    ) : null}
                  </div>

                  {appointmentsError ? (
                    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {appointmentsError}
                    </div>
                  ) : null}

                  <div className="mt-6">
                    {content.appointmentStatusSummary ? (
                      <div className="mb-5 flex flex-wrap gap-3">
                        {content.appointmentStatusSummary.map((item) => (
                          <div
                            key={item.label}
                            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${item.className}`}
                          >
                            <span>{item.label}</span>
                            <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-bold text-slate-900">
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {content.appointmentsError ? (
                      <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-10 text-center">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-600">Appointments error</p>
                        <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">Unable to load appointments</h3>
                        <p className="mt-3 text-sm leading-6 text-slate-600">{content.appointmentsError}</p>
                      </div>
                    ) : content.appointments === undefined ? (
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-10 text-center">
                        <div className="mx-auto size-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />
                        <p className="mt-4 text-sm font-medium text-slate-600">Loading appointments...</p>
                      </div>
                    ) : content.appointments.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">No appointments</p>
                        <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">You have no bookings yet</h3>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          Book your first appointment from the doctors page to see it appear here.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {content.appointments.map((appointment) => {
                          const meta = appointmentStatusMeta(appointment.status);
                          const isCancellable = appointment.status === "pending" || appointment.status === "confirmed";
                          const appointmentId = appointment._id ?? "";

                          return (
                            <article
                              key={appointmentId || `${appointment.appointmentDate}-${appointment.startTime}`}
                              className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-slate-950">{formatAppointmentDoctor(appointment.doctorId)}</p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {appointment.reason?.trim() ? appointment.reason : "No reason provided"}
                                  </p>
                                </div>
                                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}>
                                  {meta.label}
                                </span>
                              </div>

                              <div className="mt-4 space-y-2 text-sm text-slate-600">
                                <div className="flex items-center justify-between gap-3">
                                  <span>Date</span>
                                  <span className="font-medium text-slate-900">{formatAppointmentDate(appointment.appointmentDate)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <span>Start time</span>
                                  <span className="font-medium text-slate-900">{appointment.startTime ?? "--:--"}</span>
                                </div>
                              </div>

                              {isCancellable ? (
                                <button
                                  type="button"
                                  onClick={() => handleCancelAppointment(appointmentId)}
                                  disabled={isCancellingId === appointmentId}
                                  className="mt-5 inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                  {isCancellingId === appointmentId ? "Cancelling..." : "Cancel appointment"}
                                </button>
                              ) : null}
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      ) : user.role === "doctor" ? (
        activeSection === "Availability" ? (
          <section className="bg-slate-50 px-6 pb-10 text-slate-900">
            <div className="mx-auto max-w-[1600px]">
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Availability</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight">Your availability schedule</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Create, edit, and delete weekly availability windows for your profile.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      {formatCount(content.availability?.length ?? 0)} records
                    </div>
                  </div>

                {availabilityMessage ? (
                  <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {availabilityMessage}
                  </div>
                ) : null}

                {availabilityError || content.availabilityError ? (
                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {availabilityError || content.availabilityError}
                  </div>
                ) : null}

                  <form onSubmit={handleAvailabilitySubmit} className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                        {editingAvailabilityId ? "Edit availability" : "Create availability"}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
                        {editingAvailabilityId ? "Update your availability window" : "Add a new weekly availability slot"}
                      </h3>
                    </div>
                    {editingAvailabilityId ? (
                      <button
                        type="button"
                        onClick={cancelAvailabilityEdit}
                        className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Cancel edit
                      </button>
                    ) : null}
                  </div>

                    <input type="hidden" value={availabilityForm.doctorId} readOnly />

                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Day of week</span>
                      <select
                        value={availabilityForm.dayOfWeek}
                        onChange={(event) =>
                          setAvailabilityForm((current) => ({ ...current, dayOfWeek: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                      >
                        {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                          <option key={day} value={day}>
                            {availabilityDayLabel(day)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Start time</span>
                      <input
                        type="time"
                        value={availabilityForm.startTime}
                        onChange={(event) =>
                          setAvailabilityForm((current) => ({ ...current, startTime: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                        required
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">End time</span>
                      <input
                        type="time"
                        value={availabilityForm.endTime}
                        onChange={(event) =>
                          setAvailabilityForm((current) => ({ ...current, endTime: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                        required
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Slot duration minutes</span>
                      <input
                        type="number"
                        min={5}
                        step={5}
                        value={availabilityForm.slotDurationMinutes}
                        onChange={(event) =>
                          setAvailabilityForm((current) => ({ ...current, slotDurationMinutes: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                        required
                      />
                    </label>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={isSavingAvailability}
                      className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold !text-white transition hover:bg-blue-700 hover:!text-white disabled:cursor-not-allowed disabled:opacity-70"
                      style={{ color: "#ffffff" }}
                    >
                      {isSavingAvailability
                        ? editingAvailabilityId
                          ? "Saving..."
                          : "Creating..."
                        : editingAvailabilityId
                          ? "Save changes"
                          : "Create availability"}
                    </button>
                  </div>
                </form>

                {content.availability === undefined ? (
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center">
                    <div className="mx-auto size-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />
                    <p className="mt-3 text-sm text-slate-600">Loading availability...</p>
                  </div>
                  ) : content.availability.length === 0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">No availability</p>
                      <p className="mt-2 text-sm text-slate-600">Your weekly availability will appear here once added.</p>
                    </div>
                  ) : (
                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {content.availability.map((availabilityItem) => {
                      const availabilityId = availabilityItem._id ?? "";
                      const isActive = availabilityItem.isActive !== false;

                      return (
                        <article
                          key={availabilityId || `${availabilityItem.dayOfWeek}-${availabilityItem.startTime}`}
                          className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-950">
                                {availabilityDayLabel(availabilityItem.dayOfWeek)}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {formatTime(availabilityItem.startTime)} - {formatTime(availabilityItem.endTime)}
                              </p>
                            </div>
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                isActive
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-slate-200 bg-slate-100 text-slate-600"
                              }`}
                            >
                              {isActive ? "Active" : "Inactive"}
                            </span>
                          </div>

                          <div className="mt-4 space-y-2 text-sm text-slate-600">
                            <div className="flex items-center justify-between gap-3">
                              <span>Start time</span>
                              <span className="font-medium text-slate-900">{formatTime(availabilityItem.startTime)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span>End time</span>
                              <span className="font-medium text-slate-900">{formatTime(availabilityItem.endTime)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span>Slot duration</span>
                              <span className="font-medium text-slate-900">{availabilityItem.slotDurationMinutes ?? 30} min</span>
                            </div>
                          </div>

                          <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            <button
                              type="button"
                              onClick={() => startAvailabilityEdit(availabilityItem)}
                              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAvailabilityDelete(availabilityId)}
                              disabled={isDeletingAvailabilityId === availabilityId}
                              className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {isDeletingAvailabilityId === availabilityId ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className="bg-slate-50 px-6 pb-10 text-slate-900">
            <div className="mx-auto max-w-[1600px]">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Appointments</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">Your appointment queue</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Pulled directly from <span className="font-medium text-slate-700">/api/appointments/me</span>.
                    </p>
                  </div>
                  {appointmentsMessage ? (
                    <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                      {appointmentsMessage}
                    </div>
                  ) : null}
                </div>

                <div className="mt-6">
                  {appointmentsError ? (
                    <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {appointmentsError}
                    </div>
                  ) : null}

                  {content.appointmentsError ? (
                    <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-10 text-center">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-600">Appointments error</p>
                      <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">Unable to load appointments</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{content.appointmentsError}</p>
                    </div>
                  ) : content.appointments === undefined ? (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-10 text-center">
                      <div className="mx-auto size-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />
                      <p className="mt-4 text-sm font-medium text-slate-600">Loading appointments...</p>
                    </div>
                  ) : content.appointments.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">No appointments</p>
                      <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">No appointments are assigned yet</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        When patients book with your profile, their appointments will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {content.appointments.map((appointment) => {
                        const meta = appointmentStatusMeta(appointment.status);
                        const appointmentId = appointment._id ?? "";
                        const isPending = appointment.status === "pending";
                        const isConfirmed = appointment.status === "confirmed";
                        const isActionable = isPending || isConfirmed;

                        return (
                          <article
                            key={appointmentId || `${appointment.appointmentDate}-${appointment.startTime}`}
                            className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-950">
                                  {formatAppointmentPatient(appointment.patientId)}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {appointment.reason?.trim() ? appointment.reason : "No reason provided"}
                                </p>
                              </div>
                              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}>
                                {meta.label}
                              </span>
                            </div>

                            <div className="mt-4 space-y-2 text-sm text-slate-600">
                              <div className="flex items-center justify-between gap-3">
                                <span>Date</span>
                                <span className="font-medium text-slate-900">
                                  {formatAppointmentDate(appointment.appointmentDate)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span>Start time</span>
                                <span className="font-medium text-slate-900">{appointment.startTime ?? "--:--"}</span>
                              </div>
                            </div>

                            {isActionable ? (
                              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                {isPending ? (
                                <button
                                  type="button"
                                  onClick={() => handleDoctorAppointmentAction(appointmentId, "confirmed")}
                                  disabled={isUpdatingAppointmentId === appointmentId}
                                  className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                  {isUpdatingAppointmentId === appointmentId ? "Updating..." : "Confirm"}
                                </button>
                                ) : null}

                                {isConfirmed ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleDoctorAppointmentAction(appointmentId, "completed")}
                                      disabled={isUpdatingAppointmentId === appointmentId}
                                      className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                      {isUpdatingAppointmentId === appointmentId ? "Updating..." : "Complete"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDoctorAppointmentAction(appointmentId, "no_show")}
                                      disabled={isUpdatingAppointmentId === appointmentId}
                                      className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                      {isUpdatingAppointmentId === appointmentId ? "Updating..." : "Mark no-show"}
                                    </button>
                                  </>
                                ) : null}

                                <button
                                  type="button"
                                  onClick={() => handleDoctorAppointmentAction(appointmentId, "cancelled")}
                                  disabled={isUpdatingAppointmentId === appointmentId}
                                  className={`inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 ${isPending ? "" : "sm:col-span-2"}`}
                                >
                                  {isUpdatingAppointmentId === appointmentId ? "Updating..." : "Cancel"}
                                </button>
                              </div>
                            ) : null}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )
      ) : user.role === "clinic_admin" || user.role === "super_admin" ? (
        activeSection === "Overview" ? (
          <section className="bg-slate-50 px-6 pb-10 text-slate-900">
          <div className="mx-auto max-w-[1600px]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Overview</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">Live clinic overview and records</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Pulling doctors, departments, appointments, and overview totals from live backend APIs.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                {content.doctorsError || content.departmentsError || content.appointmentsError ? (
                  <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {[content.doctorsError, content.departmentsError, content.appointmentsError].filter(Boolean).join(" • ")}
                  </div>
                ) : null}

                {content.appointmentStatusSummary ? (
                  <div className="mb-6 flex flex-wrap gap-3">
                    {content.appointmentStatusSummary.map((item) => (
                      <div
                        key={item.label}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${item.className}`}
                      >
                        <span>{item.label}</span>
                        <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-bold text-slate-900">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  {content.stats.map((stat) => (
                    <article
                      key={stat.label}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-sm font-medium text-slate-600">{stat.label}</div>
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Live</span>
                      </div>
                      <div className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{stat.value}</div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{stat.detail}</p>
                    </article>
                  ))}
                </div>

                <div className="mt-8 grid gap-6">
                  <div className="rounded-3xl border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Recent activity</p>
                        <p className="mt-1 text-sm text-slate-500">A live summary of the latest platform activity.</p>
                      </div>
                      <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        Updated now
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      {content.highlights.map((item) => (
                        <div key={item} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                          <div className="mt-0.5 grid size-8 place-items-center rounded-full bg-blue-50 text-blue-600">
                            <BellRing className="size-4" />
                          </div>
                          <p className="text-sm leading-6 text-slate-700">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </section>
        ) : activeSection === "Doctors" ? (
          <section className="bg-slate-50 px-6 pb-10 text-slate-900">
            <div className="mx-auto max-w-[1600px]">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Doctors</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">Doctor approval and visibility management</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Manage pending, approved, and hidden doctor profiles.</p>
                    <p className="mt-2 text-sm font-medium text-slate-500">Click a doctor card to view full details.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm text-slate-500">{formatCount(content.doctors?.length ?? 0)} records</p>
                    <button
                      type="button"
                      onClick={openDoctorCreateForm}
                      className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold !text-white transition hover:bg-blue-700 hover:!text-white"
                      style={{ color: "#ffffff" }}
                    >
                      Add Doctor
                    </button>
                  </div>
                </div>

                {isDoctorFormOpen ? (
                  <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                          {editingDoctorId ? "Edit doctor" : "Create doctor"}
                        </p>
                        <h4 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
                          {editingDoctorId ? "Update doctor account and profile" : "Add a new doctor account for the clinic"}
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          Active doctors are approved immediately. Pending doctors stay hidden until approved.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={closeDoctorForm}
                        className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Close
                      </button>
                    </div>

                    <form onSubmit={handleDoctorCreateSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Full name</span>
                        <input
                          type="text"
                          value={doctorCreationForm.name}
                          onChange={(event) =>
                            setDoctorCreationForm((current) => ({ ...current, name: event.target.value }))
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                          placeholder="Dr. Jane Doe"
                          required
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Email</span>
                        <input
                          type="email"
                          value={doctorCreationForm.email}
                          onChange={(event) =>
                            setDoctorCreationForm((current) => ({ ...current, email: event.target.value }))
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                          placeholder="doctor@example.com"
                          required
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">
                          {editingDoctorId ? "Temporary password (optional)" : "Temporary password"}
                        </span>
                        <input
                          type="password"
                          value={doctorCreationForm.password}
                          onChange={(event) =>
                            setDoctorCreationForm((current) => ({ ...current, password: event.target.value }))
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                          placeholder={editingDoctorId ? "Leave blank to keep current password" : "Create a temporary password"}
                          required={!editingDoctorId}
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Department</span>
                        <select
                          value={doctorCreationForm.departmentId}
                          onChange={(event) =>
                            setDoctorCreationForm((current) => ({ ...current, departmentId: event.target.value }))
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                        >
                          <option value="">Not assigned</option>
                          {(content.departments ?? []).map((department) => (
                            <option key={department._id ?? department.name} value={department._id ?? ""}>
                              {department.name ?? "Unnamed department"}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Specialization</span>
                        <input
                          type="text"
                          value={doctorCreationForm.specialization}
                          onChange={(event) =>
                            setDoctorCreationForm((current) => ({ ...current, specialization: event.target.value }))
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                          placeholder="General Practice"
                          required
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Experience (years)</span>
                        <input
                          type="number"
                          min="0"
                          value={doctorCreationForm.experienceYears}
                          onChange={(event) =>
                            setDoctorCreationForm((current) => ({ ...current, experienceYears: event.target.value }))
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                          placeholder="5"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Consultation fee (NPR)</span>
                        <input
                          type="number"
                          min="0"
                          value={doctorCreationForm.consultationFee}
                          onChange={(event) =>
                            setDoctorCreationForm((current) => ({ ...current, consultationFee: event.target.value }))
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                          placeholder="1000"
                        />
                      </label>

                      <label className="space-y-2 md:col-span-2">
                        <span className="text-sm font-medium text-slate-700">Bio</span>
                        <textarea
                          value={doctorCreationForm.bio}
                          onChange={(event) =>
                            setDoctorCreationForm((current) => ({ ...current, bio: event.target.value }))
                          }
                          className="min-h-[120px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                          placeholder="Short doctor profile description"
                        />
                      </label>

                      <label className="space-y-2 md:col-span-2">
                        <span className="text-sm font-medium text-slate-700">Status</span>
                        <select
                          value={doctorCreationForm.status}
                          onChange={(event) =>
                            setDoctorCreationForm((current) => ({
                              ...current,
                              status: event.target.value as DoctorCreationStatus,
                            }))
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="active">Active</option>
                        </select>
                      </label>

                      <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-1">
                        <button
                          type="submit"
                          disabled={isSavingDoctor}
                          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold !text-white transition hover:bg-blue-700 hover:!text-white disabled:cursor-not-allowed disabled:opacity-70"
                          style={{ color: "#ffffff" }}
                        >
                          {isSavingDoctor
                            ? editingDoctorId
                              ? "Saving..."
                              : "Creating..."
                            : editingDoctorId
                              ? "Save changes"
                              : "Create doctor"}
                        </button>
                        <p className="text-sm text-slate-500">The doctor can log in immediately with the temporary password.</p>
                      </div>
                    </form>
                  </div>
                ) : null}

                {doctorCreationMessage ? (
                  <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {doctorCreationMessage}
                  </div>
                ) : null}

                {doctorCreationError ? (
                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {doctorCreationError}
                  </div>
                ) : null}

                {doctorsMessage ? (
                  <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {doctorsMessage}
                  </div>
                ) : null}

                {content.doctorsError || doctorsError ? (
                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {content.doctorsError ?? doctorsError}
                  </div>
                ) : null}

                {content.doctors === undefined ? (
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center">
                    <div className="mx-auto size-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />
                    <p className="mt-3 text-sm text-slate-600">Loading doctors...</p>
                  </div>
                ) : content.doctors.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">No doctors</p>
                    <p className="mt-2 text-sm text-slate-600">Doctor records will appear here once they are created.</p>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {content.doctors.map((doctor) => {
                      const doctorId = doctor._id ?? "";
                      const avatarSrc = getDoctorAvatarSrc(doctor);
                      const statusMeta = doctorStatusMeta(doctor.profileStatus, doctor.isPublic);
                      const doctorsBasePath = user?.role === "super_admin" ? "/superadmin" : "/admin";
                      const doctorHref = doctorId ? `${doctorsBasePath}/doctors/${doctorId}` : doctorsBasePath;

                      return (
                        <Link
                          key={doctorId || `${typeof doctor.userId === "string" ? doctor.userId : doctor.userId?.email}-${doctor.specialization}`}
                          href={doctorHref}
                          className="group block h-full cursor-pointer"
                        >
                          <article className="h-full overflow-hidden rounded-3xl border border-white bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition group-hover:-translate-y-0.5 group-hover:shadow-[0_18px_42px_rgba(15,23,42,0.08)]">
                            <div className="bg-gradient-to-br from-slate-50 via-white to-sky-50 p-2.5">
                              <div className="h-[6.5rem] overflow-hidden rounded-[1rem] bg-white sm:h-28">
                                {avatarSrc ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={avatarSrc}
                                    alt={formatDoctorName(doctor)}
                                    className="h-full w-full object-contain object-center p-0.5"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center">
                                    <div className="grid size-[3.75rem] place-items-center rounded-[1rem] bg-gradient-to-br from-blue-600 to-cyan-500 text-lg font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.2)]">
                                      {getDoctorInitials(doctor)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-slate-950">
                                    {formatDoctorName(doctor)}
                                  </p>
                                  <p className="mt-1 truncate text-xs text-slate-500">
                                    {doctor.specialization ?? "General Practice"}
                                  </p>
                                </div>
                                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusMeta.className}`}>
                                  {doctorCardStatusLabel(doctor.profileStatus)}
                                </span>
                              </div>

                              <div className="mt-3 flex items-center justify-start gap-3">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    doctor.isAvailable
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {doctor.isAvailable ? "Available" : "Unavailable"}
                                </span>
                              </div>
                            </div>
                          </article>
                        </Link>
                      );
                    })}
                  </div>
                )}

              </div>
            </div>
          </section>
        ) : activeSection === "Departments" ? (
          <section className="bg-slate-50 px-6 pb-10 text-slate-900">
            <div className="mx-auto max-w-[1600px]">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Departments</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">Manage clinic departments and specialties</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Create, edit, and delete departments from this section.
                    </p>
                  </div>
                  <p className="text-sm text-slate-500">{formatCount(content.departments?.length ?? 0)} records</p>
                </div>

                {departmentsMessage ? (
                  <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {departmentsMessage}
                  </div>
                ) : null}

                {content.departmentsError ? (
                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {content.departmentsError}
                  </div>
                ) : null}

                <form onSubmit={handleDepartmentSubmit} className="mt-5 rounded-3xl border border-white bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                        {editingDepartmentId ? "Edit department" : "Create department"}
                      </p>
                      <h4 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
                        {editingDepartmentId ? "Update department details" : "Add a new department"}
                      </h4>
                    </div>
                    {editingDepartmentId ? (
                      <button
                        type="button"
                        onClick={cancelDepartmentEdit}
                        className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Cancel edit
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Name</span>
                      <input
                        type="text"
                        value={departmentForm.name}
                        onChange={(event) => setDepartmentForm((current) => ({ ...current, name: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                        placeholder="General Medicine"
                        required
                      />
                    </label>

                    <label className="space-y-2 md:col-span-2">
                      <span className="text-sm font-medium text-slate-700">Description</span>
                      <textarea
                        value={departmentForm.description}
                        onChange={(event) => setDepartmentForm((current) => ({ ...current, description: event.target.value }))}
                        className="min-h-[120px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                        placeholder="Describe the department focus"
                      />
                    </label>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={isSavingDepartment}
                      className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold !text-white transition hover:bg-blue-700 hover:!text-white disabled:cursor-not-allowed disabled:opacity-70"
                      style={{ color: "#ffffff" }}
                    >
                      {isSavingDepartment
                        ? editingDepartmentId
                          ? "Saving..."
                          : "Creating..."
                        : editingDepartmentId
                          ? "Save changes"
                          : "Create department"}
                    </button>
                  </div>
                </form>

                {content.departments === undefined ? (
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center">
                    <div className="mx-auto size-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />
                    <p className="mt-3 text-sm text-slate-600">Loading departments...</p>
                  </div>
                ) : content.departments.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">No departments</p>
                    <p className="mt-2 text-sm text-slate-600">Department records will appear here once they are added.</p>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {content.departments.map((department) => {
                      const departmentId = department._id ?? "";
                      const isActive = department.isActive !== false;

                      return (
                        <article
                          key={departmentId || department.name}
                          className="rounded-2xl border border-white bg-white px-4 py-4 shadow-[0_6px_20px_rgba(15,23,42,0.03)]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-950">{department.name ?? "Unnamed department"}</p>
                              <p className="mt-1 text-sm leading-6 text-slate-600">
                                {department.description?.trim() ? department.description : "No description available."}
                              </p>
                            </div>
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"
                              }`}
                            >
                              {isActive ? "Active" : "Inactive"}
                            </span>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => startDepartmentEdit(department)}
                              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDepartmentDelete(departmentId)}
                              disabled={isDeletingDepartmentId === departmentId}
                              className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {isDeletingDepartmentId === departmentId ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : activeSection === "Appointments" ? (
          <section className="bg-slate-50 px-6 pb-10 text-slate-900">
            <div className="mx-auto max-w-[1600px]">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Appointments</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">Appointment records</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">View live appointment activity with patient, doctor, time, and status details.</p>
                  </div>
                  <p className="text-sm text-slate-500">{formatCount(content.appointments?.length ?? 0)} total records</p>
                </div>

                {appointmentsMessage ? (
                  <div className="mt-5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                    {appointmentsMessage}
                  </div>
                ) : null}

                {content.appointmentsError ? (
                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {content.appointmentsError}
                  </div>
                ) : content.appointments === undefined ? (
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center">
                    <div className="mx-auto size-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />
                    <p className="mt-3 text-sm text-slate-600">Loading appointments...</p>
                  </div>
                ) : content.appointments.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">No appointments</p>
                    <p className="mt-2 text-sm text-slate-600">Appointment records will appear here once bookings are made.</p>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {content.appointments.slice(0, 6).map((appointment) => {
                      const meta = appointmentStatusMeta(appointment.status);
                      const appointmentId = appointment._id ?? "";
                      const isPending = appointment.status === "pending";
                      const isConfirmed = appointment.status === "confirmed";
                      const isActionable = isPending || isConfirmed;

                      return (
                        <div
                          key={appointmentId || `${appointment.appointmentDate}-${appointment.startTime}`}
                          className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-950">{formatAppointmentPatient(appointment.patientId)}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {appointment.reason?.trim() ? appointment.reason : "No reason provided"}
                              </p>
                            </div>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}>
                              {meta.label}
                            </span>
                          </div>
                          <div className="mt-4 space-y-2 text-sm text-slate-600">
                            <div className="flex items-center justify-between gap-3">
                              <span>Date</span>
                              <span className="font-medium text-slate-900">{formatAppointmentDate(appointment.appointmentDate)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span>Start time</span>
                              <span className="font-medium text-slate-900">{appointment.startTime ?? "--:--"}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span>Doctor</span>
                              <span className="font-medium text-slate-900">{formatAppointmentDoctor(appointment.doctorId)}</span>
                            </div>
                          </div>

                          {isActionable ? (
                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                              {isPending ? (
                                <button
                                  type="button"
                                  onClick={() => handleDoctorAppointmentAction(appointmentId, "confirmed")}
                                  disabled={isUpdatingAppointmentId === appointmentId}
                                  className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                  {isUpdatingAppointmentId === appointmentId ? "Updating..." : "Confirm"}
                                </button>
                              ) : null}

                              {isConfirmed ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleDoctorAppointmentAction(appointmentId, "completed")}
                                    disabled={isUpdatingAppointmentId === appointmentId}
                                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                                  >
                                    {isUpdatingAppointmentId === appointmentId ? "Updating..." : "Complete"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDoctorAppointmentAction(appointmentId, "no_show")}
                                    disabled={isUpdatingAppointmentId === appointmentId}
                                    className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                                  >
                                    {isUpdatingAppointmentId === appointmentId ? "Updating..." : "Mark no-show"}
                                  </button>
                                </>
                              ) : null}

                              <button
                                type="button"
                                onClick={() => handleDoctorAppointmentAction(appointmentId, "cancelled")}
                                disabled={isUpdatingAppointmentId === appointmentId}
                                className={`inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 ${isPending ? "" : "sm:col-span-2"}`}
                              >
                                {isUpdatingAppointmentId === appointmentId ? "Updating..." : "Cancel"}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : activeSection === "Clinics" ? (
          <section className="bg-slate-50 px-6 pb-10 text-slate-900">
            <div className="mx-auto max-w-[1600px]">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Clinics</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">Manage clinic visibility and directory data</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Clinic records and publishing controls will live here.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {[
                    { title: "Clinic directory", text: "Add and review clinic records when the clinic module is connected." },
                    { title: "Publishing controls", text: "Control which clinic profiles are visible to the platform." },
                    { title: "Onboarding flow", text: "Track pending clinics and approval steps in one place." },
                  ].map((item) => (
                    <article key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Clinic area</p>
                      <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">{item.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : activeSection === "Doctors" ? (
          <section className="bg-slate-50 px-6 pb-10 text-slate-900">
            <div className="mx-auto max-w-[1600px]">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Doctors</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">Doctor approval and visibility management</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Manage pending, approved, and hidden doctor profiles.</p>
                    <p className="mt-2 text-sm font-medium text-slate-500">Click a doctor card to view full details.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm text-slate-500">{formatCount(content.doctors?.length ?? 0)} records</p>
                    <button
                      type="button"
                      onClick={openDoctorCreateForm}
                      className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold !text-white transition hover:bg-blue-700 hover:!text-white"
                      style={{ color: "#ffffff" }}
                    >
                      Add Doctor
                    </button>
                  </div>
                </div>

                {isDoctorFormOpen ? (
                  <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                          {editingDoctorId ? "Edit doctor" : "Create doctor"}
                        </p>
                        <h4 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
                          {editingDoctorId ? "Update doctor account and profile" : "Add a new doctor account for the clinic"}
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          Active doctors are approved immediately. Pending doctors stay hidden until approved.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={closeDoctorForm}
                        className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Close
                      </button>
                    </div>

                    <form onSubmit={handleDoctorCreateSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Full name</span>
                        <input
                          type="text"
                          value={doctorCreationForm.name}
                          onChange={(event) =>
                            setDoctorCreationForm((current) => ({ ...current, name: event.target.value }))
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                          placeholder="Dr. Jane Doe"
                          required
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Email</span>
                        <input
                          type="email"
                          value={doctorCreationForm.email}
                          onChange={(event) =>
                            setDoctorCreationForm((current) => ({ ...current, email: event.target.value }))
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                          placeholder="doctor@example.com"
                          required
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">
                          {editingDoctorId ? "Temporary password (optional)" : "Temporary password"}
                        </span>
                        <input
                          type="password"
                          value={doctorCreationForm.password}
                          onChange={(event) =>
                            setDoctorCreationForm((current) => ({ ...current, password: event.target.value }))
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                          placeholder={editingDoctorId ? "Leave blank to keep current password" : "Create a temporary password"}
                          required={!editingDoctorId}
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Department</span>
                        <select
                          value={doctorCreationForm.departmentId}
                          onChange={(event) =>
                            setDoctorCreationForm((current) => ({ ...current, departmentId: event.target.value }))
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                        >
                          <option value="">Not assigned</option>
                          {(content.departments ?? []).map((department) => (
                            <option key={department._id ?? department.name} value={department._id ?? ""}>
                              {department.name ?? "Unnamed department"}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Specialization</span>
                        <input
                          type="text"
                          value={doctorCreationForm.specialization}
                          onChange={(event) =>
                            setDoctorCreationForm((current) => ({ ...current, specialization: event.target.value }))
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                          placeholder="General Practice"
                          required
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Experience (years)</span>
                        <input
                          type="number"
                          min="0"
                          value={doctorCreationForm.experienceYears}
                          onChange={(event) =>
                            setDoctorCreationForm((current) => ({ ...current, experienceYears: event.target.value }))
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                          placeholder="5"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Consultation fee (NPR)</span>
                        <input
                          type="number"
                          min="0"
                          value={doctorCreationForm.consultationFee}
                          onChange={(event) =>
                            setDoctorCreationForm((current) => ({ ...current, consultationFee: event.target.value }))
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                          placeholder="1000"
                        />
                      </label>

                      <label className="space-y-2 md:col-span-2">
                        <span className="text-sm font-medium text-slate-700">Bio</span>
                        <textarea
                          value={doctorCreationForm.bio}
                          onChange={(event) =>
                            setDoctorCreationForm((current) => ({ ...current, bio: event.target.value }))
                          }
                          className="min-h-[120px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                          placeholder="Short doctor profile description"
                        />
                      </label>

                      <label className="space-y-2 md:col-span-2">
                        <span className="text-sm font-medium text-slate-700">Status</span>
                        <select
                          value={doctorCreationForm.status}
                          onChange={(event) =>
                            setDoctorCreationForm((current) => ({
                              ...current,
                              status: event.target.value as DoctorCreationStatus,
                            }))
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="active">Active</option>
                        </select>
                      </label>

                      <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-1">
                        <button
                          type="submit"
                          disabled={isSavingDoctor}
                          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold !text-white transition hover:bg-blue-700 hover:!text-white disabled:cursor-not-allowed disabled:opacity-70"
                          style={{ color: "#ffffff" }}
                        >
                          {isSavingDoctor
                            ? editingDoctorId
                              ? "Saving..."
                              : "Creating..."
                            : editingDoctorId
                              ? "Save changes"
                              : "Create doctor"}
                        </button>
                        <p className="text-sm text-slate-500">The doctor can log in immediately with the temporary password.</p>
                      </div>
                    </form>
                  </div>
                ) : null}

                {doctorCreationMessage ? (
                  <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {doctorCreationMessage}
                  </div>
                ) : null}

                {doctorCreationError ? (
                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {doctorCreationError}
                  </div>
                ) : null}

                {doctorsMessage ? (
                  <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {doctorsMessage}
                  </div>
                ) : null}

                {content.doctorsError || doctorsError ? (
                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {content.doctorsError ?? doctorsError}
                  </div>
                ) : null}

                {content.doctors === undefined ? (
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center">
                    <div className="mx-auto size-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />
                    <p className="mt-3 text-sm text-slate-600">Loading doctors...</p>
                  </div>
                ) : content.doctors.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">No doctors</p>
                    <p className="mt-2 text-sm text-slate-600">Doctor records will appear here once they are created.</p>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {content.doctors.map((doctor) => {
                      const doctorId = doctor._id ?? "";
                      const avatarSrc = getDoctorAvatarSrc(doctor);
                      const statusMeta = doctorStatusMeta(doctor.profileStatus, doctor.isPublic);
                      const doctorsBasePath = user?.role === "super_admin" ? "/superadmin" : "/admin";
                      const doctorHref = doctorId ? `${doctorsBasePath}/doctors/${doctorId}` : doctorsBasePath;

                      return (
                        <Link
                          key={doctorId || `${typeof doctor.userId === "string" ? doctor.userId : doctor.userId?.email}-${doctor.specialization}`}
                          href={doctorHref}
                          className="group block h-full cursor-pointer"
                        >
                          <article className="h-full overflow-hidden rounded-3xl border border-white bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition group-hover:-translate-y-0.5 group-hover:shadow-[0_18px_42px_rgba(15,23,42,0.08)]">
                            <div className="bg-gradient-to-br from-slate-50 via-white to-sky-50 p-2.5">
                              <div className="h-[6.5rem] overflow-hidden rounded-[1rem] bg-white sm:h-28">
                                {avatarSrc ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={avatarSrc}
                                    alt={formatDoctorName(doctor)}
                                    className="h-full w-full object-contain object-center p-0.5"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center">
                                    <div className="grid size-[3.75rem] place-items-center rounded-[1rem] bg-gradient-to-br from-blue-600 to-cyan-500 text-lg font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.2)]">
                                      {getDoctorInitials(doctor)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-slate-950">
                                    {formatDoctorName(doctor)}
                                  </p>
                                  <p className="mt-1 truncate text-xs text-slate-500">
                                    {doctor.specialization ?? "General Practice"}
                                  </p>
                                </div>
                                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusMeta.className}`}>
                                  {doctorCardStatusLabel(doctor.profileStatus)}
                                </span>
                              </div>

                              <div className="mt-3 flex items-center justify-start gap-3">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    doctor.isAvailable
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {doctor.isAvailable ? "Available" : "Unavailable"}
                                </span>
                              </div>
                            </div>
                          </article>
                        </Link>
                      );
                    })}
                  </div>
                )}

              </div>
            </div>
          </section>
        ) : activeSection === "Departments" ? (
          <section className="bg-slate-50 px-6 pb-10 text-slate-900">
            <div className="mx-auto max-w-[1600px]">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Departments</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">Department management</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Create, edit, and delete clinic specialties from this section.</p>
                  </div>
                  <p className="text-sm text-slate-500">{formatCount(content.departments?.length ?? 0)} records</p>
                </div>

                {departmentsMessage ? (
                  <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {departmentsMessage}
                  </div>
                ) : null}

                {content.departmentsError ? (
                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {content.departmentsError}
                  </div>
                ) : null}

                <form onSubmit={handleDepartmentSubmit} className="mt-5 rounded-3xl border border-white bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                        {editingDepartmentId ? "Edit department" : "Create department"}
                      </p>
                      <h4 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
                        {editingDepartmentId ? "Update department details" : "Add a new department"}
                      </h4>
                    </div>
                    {editingDepartmentId ? (
                      <button
                        type="button"
                        onClick={cancelDepartmentEdit}
                        className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Cancel edit
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Name</span>
                      <input
                        type="text"
                        value={departmentForm.name}
                        onChange={(event) => setDepartmentForm((current) => ({ ...current, name: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                        placeholder="General Medicine"
                        required
                      />
                    </label>

                    <label className="space-y-2 md:col-span-2">
                      <span className="text-sm font-medium text-slate-700">Description</span>
                      <textarea
                        value={departmentForm.description}
                        onChange={(event) => setDepartmentForm((current) => ({ ...current, description: event.target.value }))}
                        className="min-h-[120px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500"
                        placeholder="Describe the department focus"
                      />
                    </label>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSavingDepartment}
                  className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold !text-white transition hover:bg-blue-700 hover:!text-white disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ color: "#ffffff" }}
                >
                  {isSavingDepartment
                    ? editingDepartmentId
                          ? "Saving..."
                          : "Creating..."
                        : editingDepartmentId
                          ? "Save changes"
                          : "Create department"}
                    </button>
                  </div>
                </form>

                {content.departments === undefined ? (
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center">
                    <div className="mx-auto size-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />
                    <p className="mt-3 text-sm text-slate-600">Loading departments...</p>
                  </div>
                ) : content.departments.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">No departments</p>
                    <p className="mt-2 text-sm text-slate-600">Department records will appear here once they are added.</p>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {content.departments.map((department) => {
                      const departmentId = department._id ?? "";
                      const isActive = department.isActive !== false;

                      return (
                        <article
                          key={departmentId || department.name}
                          className="rounded-2xl border border-white bg-white px-4 py-4 shadow-[0_6px_20px_rgba(15,23,42,0.03)]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-950">{department.name ?? "Unnamed department"}</p>
                              <p className="mt-1 text-sm leading-6 text-slate-600">
                                {department.description?.trim() ? department.description : "No description available."}
                              </p>
                            </div>
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"
                              }`}
                            >
                              {isActive ? "Active" : "Inactive"}
                            </span>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => startDepartmentEdit(department)}
                              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDepartmentDelete(departmentId)}
                              disabled={isDeletingDepartmentId === departmentId}
                              className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {isDeletingDepartmentId === departmentId ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : activeSection === "Appointments" ? (
          <section className="bg-slate-50 px-6 pb-10 text-slate-900">
            <div className="mx-auto max-w-[1600px]">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Appointments</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">Appointment records</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">View live appointment activity with patient, doctor, time, and status details.</p>
                  </div>
                  <p className="text-sm text-slate-500">{formatCount(content.appointments?.length ?? 0)} total records</p>
                </div>

                {appointmentsMessage ? (
                  <div className="mt-5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                    {appointmentsMessage}
                  </div>
                ) : null}

                {content.appointmentsError ? (
                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {content.appointmentsError}
                  </div>
                ) : content.appointments === undefined ? (
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center">
                    <div className="mx-auto size-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />
                    <p className="mt-3 text-sm text-slate-600">Loading appointments...</p>
                  </div>
                ) : content.appointments.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">No appointments</p>
                    <p className="mt-2 text-sm text-slate-600">Appointment records will appear here once bookings are made.</p>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {content.appointments.slice(0, 6).map((appointment) => {
                      const meta = appointmentStatusMeta(appointment.status);
                      const appointmentId = appointment._id ?? "";
                      const isPending = appointment.status === "pending";
                      const isConfirmed = appointment.status === "confirmed";
                      const isActionable = isPending || isConfirmed;

                      return (
                        <div
                          key={appointmentId || `${appointment.appointmentDate}-${appointment.startTime}`}
                          className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-950">{formatAppointmentPatient(appointment.patientId)}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {appointment.reason?.trim() ? appointment.reason : "No reason provided"}
                              </p>
                            </div>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}>
                              {meta.label}
                            </span>
                          </div>
                          <div className="mt-4 space-y-2 text-sm text-slate-600">
                            <div className="flex items-center justify-between gap-3">
                              <span>Date</span>
                              <span className="font-medium text-slate-900">{formatAppointmentDate(appointment.appointmentDate)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span>Start time</span>
                              <span className="font-medium text-slate-900">{appointment.startTime ?? "--:--"}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span>Doctor</span>
                              <span className="font-medium text-slate-900">{formatAppointmentDoctor(appointment.doctorId)}</span>
                            </div>
                          </div>

                          {isActionable ? (
                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                              {isPending ? (
                                <button
                                  type="button"
                                  onClick={() => handleDoctorAppointmentAction(appointmentId, "confirmed")}
                                  disabled={isUpdatingAppointmentId === appointmentId}
                                  className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                  {isUpdatingAppointmentId === appointmentId ? "Updating..." : "Confirm"}
                                </button>
                              ) : null}

                              {isConfirmed ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleDoctorAppointmentAction(appointmentId, "completed")}
                                    disabled={isUpdatingAppointmentId === appointmentId}
                                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                                  >
                                    {isUpdatingAppointmentId === appointmentId ? "Updating..." : "Complete"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDoctorAppointmentAction(appointmentId, "no_show")}
                                    disabled={isUpdatingAppointmentId === appointmentId}
                                    className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                                  >
                                    {isUpdatingAppointmentId === appointmentId ? "Updating..." : "Mark no-show"}
                                  </button>
                                </>
                              ) : null}

                              <button
                                type="button"
                                onClick={() => handleDoctorAppointmentAction(appointmentId, "cancelled")}
                                disabled={isUpdatingAppointmentId === appointmentId}
                                className={`inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 ${isPending ? "" : "sm:col-span-2"}`}
                              >
                                {isUpdatingAppointmentId === appointmentId ? "Updating..." : "Cancel"}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : activeSection === "Users" ? (
          <section className="bg-slate-50 px-6 pb-10 text-slate-900">
            <div className="mx-auto max-w-[1600px]">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Users</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">Manage platform users and roles</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      User governance and account management will be connected here.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {[
                    { title: "Account directory", text: "Review platform accounts and role assignments." },
                    { title: "Access controls", text: "Manage visibility and permissions at the platform level." },
                    { title: "Audit trail", text: "Track user changes and account activity over time." },
                  ].map((item) => (
                    <article key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">User area</p>
                      <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">{item.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : activeSection === "Subscriptions" ? (
          <section className="bg-slate-50 px-6 pb-10 text-slate-900">
            <div className="mx-auto max-w-[1600px]">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Subscriptions</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">Track plans and billing status</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Subscription management and plan usage will appear here.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {[
                    { title: "Plan overview", text: "See active and upcoming plans across the platform." },
                    { title: "Billing status", text: "Review account payment states and renewal timing." },
                    { title: "Usage summary", text: "Summarize seat and feature usage when connected." },
                  ].map((item) => (
                    <article key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Subscription area</p>
                      <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">{item.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : activeSection === "Reports" ? (
          <section className="bg-slate-50 px-6 pb-10 text-slate-900">
            <div className="mx-auto max-w-[1600px]">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Reports</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">Reports and analytics</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Analytics cards show current totals and appointment status mix only.</p>
                  </div>
                </div>

                {content.reportError ? (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {content.reportError}
                  </div>
                ) : null}

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {(content.reportStats ?? content.stats).map((stat) => (
                    <article key={stat.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-sm font-medium text-slate-600">{stat.label}</div>
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Live</span>
                      </div>
                      <div className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{stat.value}</div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{stat.detail}</p>
                    </article>
                  ))}
                </div>

                {content.reportStatusSummary ? (
                  <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Appointment status breakdown</p>
                        <p className="mt-1 text-sm text-slate-500">Counts and share of the current appointment mix.</p>
                      </div>
                      <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {sumCountValues(content.reportStatusSummary)} total
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      {content.reportStatusSummary.map((item) => {
                        const count = parseCount(item.value);
                        const total = sumCountValues(content.reportStatusSummary);
                        const percent = formatPercentage(count, total);

                        return (
                          <div key={item.label} className="space-y-2">
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-semibold ${item.className}`}>
                                <span>{item.label}</span>
                                <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-bold text-slate-900">
                                  {item.value}
                                </span>
                              </div>
                              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{percent}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-3xl border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Analytics summary</p>
                        <p className="mt-1 text-sm text-slate-500">A quick view of the latest reporting totals.</p>
                      </div>
                      <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        Updated now
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      {(content.reportHighlights ?? content.highlights).map((item) => (
                        <div key={item} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                          <div className="mt-0.5 grid size-8 place-items-center rounded-full bg-blue-50 text-blue-600">
                            <BellRing className="size-4" />
                          </div>
                          <p className="text-sm leading-6 text-slate-700">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Recent appointment report</p>
                        <p className="mt-1 text-sm text-slate-500">Pulled directly from the reporting endpoint.</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {content.reportAppointments === undefined
                          ? "Loading..."
                          : `${formatCount(content.reportAppointments.length)} records`}
                      </span>
                    </div>

                    {content.reportError ? (
                      <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {content.reportError}
                      </div>
                    ) : content.reportAppointments === undefined ? (
                      <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center">
                        <div className="mx-auto size-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />
                        <p className="mt-3 text-sm text-slate-600">Loading report records...</p>
                      </div>
                    ) : content.reportAppointments.length === 0 ? (
                      <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">No report data</p>
                        <p className="mt-2 text-sm text-slate-600">Appointment report records will appear here once data is available.</p>
                      </div>
                    ) : (
                      <div className="mt-5 space-y-3">
                        {content.reportAppointments.slice(0, 6).map((appointment) => {
                          const meta = appointmentStatusMeta(appointment.status);
                          return (
                            <article key={appointment._id ?? `${appointment.appointmentDate}-${appointment.startTime}`} className="rounded-2xl border border-white bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.03)]">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-slate-950">
                                    {formatAppointmentPatient(appointment.patientId)}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {appointment.reason?.trim() ? appointment.reason : "No reason provided"}
                                  </p>
                                </div>
                                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}>
                                  {meta.label}
                                </span>
                              </div>
                              <div className="mt-4 grid gap-2 text-sm text-slate-600">
                                <div className="flex items-center justify-between gap-3">
                                  <span>Doctor</span>
                                  <span className="font-medium text-slate-900">{formatAppointmentDoctor(appointment.doctorId)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <span>Date</span>
                                  <span className="font-medium text-slate-900">{formatAppointmentDate(appointment.appointmentDate)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <span>Start time</span>
                                  <span className="font-medium text-slate-900">{appointment.startTime ?? "--:--"}</span>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null
      ) : null}
      </DashboardShell>
    );
}
