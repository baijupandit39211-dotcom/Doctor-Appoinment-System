"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CircleAlert, Stethoscope } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { requestJson } from "@/lib/api-client";

import {
  type AvailabilityRecord,
  type DoctorRecord,
  getDoctorAvatarUrl,
  getNextAvailabilityLabel,
  loadCurrentUserSafe,
  resolveDoctorName,
} from "./doctor-helpers";

type DoctorsPageState = {
  doctors: DoctorRecord[];
  isLoading: boolean;
  error: string;
  isAuthenticated: boolean;
  availabilityByDoctorId: Record<string, AvailabilityRecord[]>;
};

function getDoctorInitials(doctor: DoctorRecord) {
  const name = resolveDoctorName(doctor).trim();
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

export function DoctorsPage() {
  const [state, setState] = useState<DoctorsPageState>({
    doctors: [],
    isLoading: true,
    error: "",
    isAuthenticated: false,
    availabilityByDoctorId: {},
  });

  useEffect(() => {
    let active = true;

    async function loadDoctorsPage() {
      try {
        const [doctorsResponse, currentUser] = await Promise.all([
          requestJson<DoctorRecord[]>("/api/doctors"),
          loadCurrentUserSafe(),
        ]);

        if (!active) {
          return;
        }

        const availabilityEntries = await Promise.allSettled(
          (doctorsResponse.data ?? []).map(async (doctor) => {
            const doctorId = doctor._id;
            const availabilityResponse = await requestJson<AvailabilityRecord[]>(`/api/availability/doctor/${doctorId}`);
            return [doctorId, availabilityResponse.data ?? []] as const;
          }),
        );

        const availabilityByDoctorId = availabilityEntries.reduce<Record<string, AvailabilityRecord[]>>(
          (summary, result) => {
            if (result.status === "fulfilled") {
              const [doctorId, availability] = result.value;
              summary[doctorId] = availability;
            }

            return summary;
          },
          {},
        );

        setState((currentState) => ({
          ...currentState,
          doctors: doctorsResponse.data ?? [],
          isAuthenticated: Boolean(currentUser),
          availabilityByDoctorId,
          isLoading: false,
        }));
      } catch (error) {
        if (!active) {
          return;
        }

        setState((currentState) => ({
          ...currentState,
          error: error instanceof Error ? error.message : "Failed to load doctors",
          isLoading: false,
        }));
      }
    }

    loadDoctorsPage();

    return () => {
      active = false;
    };
  }, []);

  const visibleCount = state.doctors.length;

  if (state.isLoading) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_34%),linear-gradient(180deg,#f8fbff_0%,#ffffff_62%)] px-5 py-10 text-slate-900 sm:px-8">
        <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center">
          <Card className="w-full max-w-xl border-slate-200 bg-white/90 shadow-sm">
            <CardContent className="py-12 text-center">
              <div className="mx-auto size-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />
              <p className="mt-4 text-sm font-medium text-slate-600">Loading doctors...</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (state.error) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_34%),linear-gradient(180deg,#f8fbff_0%,#ffffff_62%)] px-5 py-10 text-slate-900 sm:px-8">
        <div className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center">
          <Card className="w-full border-slate-200 bg-white shadow-sm">
            <CardContent className="py-12 text-center">
              <CircleAlert className="mx-auto size-10 text-blue-600" />
              <h1 className="mt-3 text-2xl font-semibold tracking-tight">Unable to load doctors</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">{state.error}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Try again
                </button>
                <Link
                  href="/login"
                  className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Go to login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_34%),linear-gradient(180deg,#f8fbff_0%,#ffffff_62%)] px-5 py-8 text-slate-900 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700">
                <Stethoscope className="size-3.5" />
                Approved doctors
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Approved doctors
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Browse approved doctors. Open a doctor card to view the full profile and booking details.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{visibleCount}</span> doctors live
              </div>
              {state.isAuthenticated ? (
                <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                  Signed in and ready to book
                </div>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Login to book <ArrowRight className="size-4" />
                </Link>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {state.doctors.map((doctor) => {
              const doctorId = doctor._id;
              const avatarUrl = getDoctorAvatarUrl(doctor);
              const availabilitySlots = state.availabilityByDoctorId[doctorId] ?? [];
              const availabilityLabel = availabilitySlots.length
                ? getNextAvailabilityLabel(availabilitySlots)
                : doctor.isAvailable
                  ? "Accepting appointments"
                  : "Currently unavailable";

              return (
                <Link
                  key={doctorId}
                  href={doctorId ? `/doctors/${doctorId}` : "/doctors"}
                  className="group block"
                >
                  <Card className="overflow-hidden border-slate-200 bg-white shadow-[0_10px_36px_rgba(15,23,42,0.05)] transition group-hover:-translate-y-0.5 group-hover:shadow-[0_18px_42px_rgba(15,23,42,0.08)]">
                    <CardContent className="p-0">
                      <div className="h-44 bg-gradient-to-br from-sky-50 via-white to-cyan-50 sm:h-48">
                        {avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={avatarUrl}
                            alt={resolveDoctorName(doctor)}
                            className="h-full w-full object-cover object-top"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <div className="grid size-24 place-items-center rounded-[2rem] bg-gradient-to-br from-blue-600 to-cyan-500 text-3xl font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.2)]">
                              {getDoctorInitials(doctor)}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="truncate text-lg font-semibold tracking-tight text-slate-950">
                              {resolveDoctorName(doctor)}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">{doctor.specialization ?? "Specialist"}</p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                              doctor.isAvailable
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {doctor.isAvailable ? "Available" : "Unavailable"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
                          <span className="truncate">{availabilityLabel}</span>
                          <ArrowRight className="size-4 shrink-0 text-blue-600 transition group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {state.doctors.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">No doctors found</p>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">No approved doctors are available yet</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Approved doctor profiles will appear here once they are published by the clinic team.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
