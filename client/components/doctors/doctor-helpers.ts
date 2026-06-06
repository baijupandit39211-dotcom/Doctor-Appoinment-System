"use client";

import type { AuthUser } from "@/lib/auth";
import { requestJson } from "@/lib/api-client";

export type PopulatedRef<T> = string | (T & { _id?: string; id?: string }) | null | undefined;

export type DoctorRecord = {
  _id: string;
  userId?: PopulatedRef<{
    name?: string;
    email?: string;
    phone?: string;
    avatar?: string;
    role?: string;
  }>;
  clinicId?: PopulatedRef<{
    name?: string;
    city?: string;
  }>;
  departmentId?: PopulatedRef<{
    name?: string;
    description?: string;
  }>;
  specialization?: string;
  qualification?: string;
  experienceYears?: number;
  consultationFee?: number;
  bio?: string;
  languages?: string[];
  isAvailable?: boolean;
};

export type DepartmentRecord = {
  _id: string;
  name?: string;
  description?: string;
  clinicId?: PopulatedRef<{
    name?: string;
    city?: string;
  }>;
  isActive?: boolean;
};

export type AvailabilityRecord = {
  _id: string;
  doctorId?: PopulatedRef<{
    _id?: string;
    specialization?: string;
  }>;
  clinicId?: PopulatedRef<{
    name?: string;
    city?: string;
  }>;
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
  slotDurationMinutes?: number;
  isActive?: boolean;
};

export function resolveRefId(ref: PopulatedRef<{ _id?: string; id?: string }>) {
  if (!ref) {
    return "";
  }

  if (typeof ref === "string") {
    return ref;
  }

  return ref._id ?? ref.id ?? "";
}

export function resolveDoctorName(doctor: DoctorRecord) {
  if (doctor.userId && typeof doctor.userId === "object" && "name" in doctor.userId && doctor.userId.name) {
    return doctor.userId.name;
  }

  return doctor.specialization ? `${doctor.specialization} specialist` : "Doctor";
}

export function resolveDoctorEmail(doctor: DoctorRecord) {
  if (doctor.userId && typeof doctor.userId === "object" && "email" in doctor.userId && doctor.userId.email) {
    return doctor.userId.email;
  }

  return "";
}

export function resolveDepartmentName(doctor: DoctorRecord) {
  if (
    doctor.departmentId &&
    typeof doctor.departmentId === "object" &&
    "name" in doctor.departmentId &&
    doctor.departmentId.name
  ) {
    return doctor.departmentId.name;
  }

  return "General";
}

export function resolveClinicName(doctor: DoctorRecord) {
  if (doctor.clinicId && typeof doctor.clinicId === "object" && "name" in doctor.clinicId && doctor.clinicId.name) {
    return doctor.clinicId.name;
  }

  return "DocPulse Clinic";
}

export function formatCurrency(value?: number | null) {
  if (typeof value !== "number") {
    return "On request";
  }

  return `NPR ${new Intl.NumberFormat("en-NP").format(value)}`;
}

export function formatExperience(value?: number | null) {
  if (typeof value !== "number") {
    return "Experience not listed";
  }

  return `${value} year${value === 1 ? "" : "s"} experience`;
}

export function formatAvailabilityLabel(isAvailable?: boolean) {
  return isAvailable ? "Accepting appointments" : "Currently unavailable";
}

export function formatDayLabel(day?: string) {
  if (!day) {
    return "Unknown day";
  }

  return day.charAt(0).toUpperCase() + day.slice(1);
}

export function formatTimeLabel(value?: string) {
  if (!value) {
    return "--:--";
  }

  return value.slice(0, 5);
}

export function formatScheduleLabel(record: AvailabilityRecord) {
  return `${formatDayLabel(record.dayOfWeek)} · ${formatTimeLabel(record.startTime)}-${formatTimeLabel(record.endTime)}`;
}

export function getNextAvailabilityLabel(slots: AvailabilityRecord[]) {
  const firstSlot = slots.find((slot) => slot.isActive !== false);

  if (!firstSlot) {
    return "";
  }

  return `Next: ${formatScheduleLabel(firstSlot)}`;
}

export async function loadCurrentUserSafe() {
  try {
    const response = await requestJson<AuthUser>("/api/auth/me");
    return response.data ?? null;
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";

    if (message.includes("unauthorized") || message.includes("not found")) {
      return null;
    }

    throw error;
  }
}
