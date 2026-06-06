"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpDown, Building2, CalendarDays, Filter, Search, Stethoscope } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requestJson } from "@/lib/api-client";

import {
  type AvailabilityRecord,
  type DepartmentRecord,
  type DoctorRecord,
  formatAvailabilityLabel,
  formatCurrency,
  formatExperience,
  getNextAvailabilityLabel,
  loadCurrentUserSafe,
  resolveClinicName,
  resolveDepartmentName,
  resolveDoctorName,
  resolveRefId,
} from "./doctor-helpers";

type DoctorsPageState = {
  doctors: DoctorRecord[];
  departments: DepartmentRecord[];
  isLoading: boolean;
  error: string;
  selectedDepartmentId: string;
  searchQuery: string;
  sortBy: "featured" | "experience_desc" | "fee_asc" | "fee_desc";
  isAuthenticated: boolean;
  availabilityByDoctorId: Record<string, AvailabilityRecord[]>;
};

type DoctorsPageProps = {
  initialSearchQuery?: string;
  initialDepartmentId?: string;
  initialSortBy?: DoctorsPageState["sortBy"];
};

function countDoctorsByDepartment(doctors: DoctorRecord[], departmentId: string) {
  return doctors.filter((doctor) => resolveRefId(doctor.departmentId) === departmentId).length;
}

function matchesSearch(doctor: DoctorRecord, searchQuery: string) {
  if (!searchQuery.trim()) {
    return true;
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const haystacks = [
    resolveDoctorName(doctor),
    doctor.specialization ?? "",
    resolveDepartmentName(doctor),
    resolveClinicName(doctor),
  ];

  return haystacks.some((value) => value.toLowerCase().includes(normalizedQuery));
}

function createDoctorsQueryString(state: Pick<DoctorsPageState, "searchQuery" | "selectedDepartmentId" | "sortBy">) {
  const params = new URLSearchParams();

  if (state.searchQuery.trim()) {
    params.set("q", state.searchQuery.trim());
  }

  if (state.selectedDepartmentId !== "all") {
    params.set("department", state.selectedDepartmentId);
  }

  if (state.sortBy !== "featured") {
    params.set("sort", state.sortBy);
  }

  return params.toString();
}

function buildDoctorDetailHref(doctorId: string, state: Pick<DoctorsPageState, "searchQuery" | "selectedDepartmentId" | "sortBy">) {
  const query = createDoctorsQueryString(state);
  return query ? `/doctors/${doctorId}?${query}` : `/doctors/${doctorId}`;
}

function normalizeSortBy(value?: string): DoctorsPageState["sortBy"] {
  if (value === "experience_desc" || value === "fee_asc" || value === "fee_desc") {
    return value;
  }

  return "featured";
}

export function DoctorsPage({
  initialSearchQuery = "",
  initialDepartmentId = "all",
  initialSortBy = "featured",
}: DoctorsPageProps) {
  const router = useRouter();
  const [state, setState] = useState<DoctorsPageState>({
    doctors: [],
    departments: [],
    isLoading: true,
    error: "",
    selectedDepartmentId: initialDepartmentId,
    searchQuery: initialSearchQuery,
    sortBy: initialSortBy,
    isAuthenticated: false,
    availabilityByDoctorId: {},
  });

  useEffect(() => {
    let active = true;

    async function loadDoctorsPage() {
      try {
        const [doctorsResponse, departmentsResponse, currentUser] = await Promise.all([
          requestJson<DoctorRecord[]>("/api/doctors"),
          requestJson<DepartmentRecord[]>("/api/departments"),
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
          departments: departmentsResponse.data ?? [],
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

  useEffect(() => {
    const query = createDoctorsQueryString(state);
    const nextUrl = query ? `/doctors?${query}` : "/doctors";

    router.replace(nextUrl, { scroll: false });
  }, [router, state.searchQuery, state.selectedDepartmentId, state.sortBy]);

  const filteredDoctors = useMemo(() => {
    let nextDoctors = state.doctors;

    if (state.selectedDepartmentId !== "all") {
      nextDoctors = nextDoctors.filter((doctor) => resolveRefId(doctor.departmentId) === state.selectedDepartmentId);
    }

    if (state.searchQuery.trim()) {
      nextDoctors = nextDoctors.filter((doctor) => matchesSearch(doctor, state.searchQuery));
    }

    const sortedDoctors = [...nextDoctors].sort((left, right) => {
      const leftExperience = left.experienceYears ?? -1;
      const rightExperience = right.experienceYears ?? -1;
      const leftFee = left.consultationFee ?? Number.POSITIVE_INFINITY;
      const rightFee = right.consultationFee ?? Number.POSITIVE_INFINITY;

      switch (state.sortBy) {
        case "experience_desc":
          return rightExperience - leftExperience;
        case "fee_asc":
          return leftFee - rightFee;
        case "fee_desc":
          return rightFee - leftFee;
        default:
          return rightExperience - leftExperience || (left.specialization ?? "").localeCompare(right.specialization ?? "");
      }
    });

    return sortedDoctors;
  }, [state.doctors, state.searchQuery, state.selectedDepartmentId, state.sortBy]);

  const visibleCount = filteredDoctors.length;
  const totalCount = state.doctors.length;
  const hasActiveFilters =
    state.selectedDepartmentId !== "all" || state.searchQuery.trim().length > 0 || state.sortBy !== "featured";

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
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Doctors error</p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight">Unable to load doctors</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">{state.error}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="rounded-full bg-[#020617] px-5 py-3 text-sm font-semibold text-white hover:bg-slate-900"
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
              <Badge className="rounded-full bg-sky-50 px-3 py-1 text-sky-700 hover:bg-sky-50">
                <Stethoscope className="mr-1 size-3.5" />
                Find a doctor
              </Badge>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Discover doctors and book appointments
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Browse live doctor profiles, check their departments and availability, then move into booking from a
                single place.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{state.doctors.length}</span> doctors live
              </div>
              {state.isAuthenticated ? (
                <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                  Signed in and ready to book
                </div>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-[#020617] px-5 py-3 text-sm font-semibold text-white hover:bg-[#020617]"
                >
                  Login to book <ArrowRight className="size-4" />
                </Link>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setState((currentState) => ({ ...currentState, selectedDepartmentId: "all" }))}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                state.selectedDepartmentId === "all"
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Filter className="size-4" />
              All departments
            </button>

            {state.departments.map((department) => {
              const departmentId = department._id;
              const isActive = state.selectedDepartmentId === departmentId;
              const doctorCount = countDoctorsByDepartment(state.doctors, departmentId);

              return (
                <button
                  key={departmentId}
                  type="button"
                  onClick={() => setState((currentState) => ({ ...currentState, selectedDepartmentId: departmentId }))}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "border-[#020617] bg-[#020617] text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {department.name ?? "Department"}
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${isActive ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {doctorCount}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                value={state.searchQuery}
                onChange={(event) =>
                  setState((currentState) => ({ ...currentState, searchQuery: event.target.value }))
                }
                placeholder="Search by doctor name, specialization, or department"
                className="h-12 rounded-full border-slate-300 bg-white pl-11 text-sm shadow-sm"
              />
            </label>

            <label className="relative block">
              <ArrowUpDown className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <select
                value={state.sortBy}
                onChange={(event) =>
                  setState((currentState) => ({
                    ...currentState,
                    sortBy: event.target.value as DoctorsPageState["sortBy"],
                  }))
                }
                className="h-12 w-full appearance-none rounded-full border border-slate-300 bg-white pl-11 pr-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-slate-400"
              >
                <option value="featured">Sort: Recommended</option>
                <option value="experience_desc">Experience: High to low</option>
                <option value="fee_asc">Fee: Low to high</option>
                <option value="fee_desc">Fee: High to low</option>
              </select>
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Showing {visibleCount} of {totalCount} doctor{totalCount === 1 ? "" : "s"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {hasActiveFilters
                  ? "Search, department, and sort preferences are applied."
                  : "All live doctors are visible right now."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {state.searchQuery.trim() ? (
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
                  Search: {state.searchQuery.trim()}
                </span>
              ) : null}
              {state.selectedDepartmentId !== "all" ? (
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
                  Department filter active
                </span>
              ) : null}
              {state.sortBy !== "featured" ? (
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
                  Sorted by{" "}
                  {state.sortBy === "experience_desc"
                    ? "experience"
                    : state.sortBy === "fee_asc"
                      ? "fee low to high"
                      : "fee high to low"}
                </span>
              ) : null}
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={() =>
                    setState((currentState) => ({
                      ...currentState,
                      selectedDepartmentId: "all",
                      searchQuery: "",
                      sortBy: "featured",
                    }))
                  }
                  className="rounded-full bg-[#020617] px-4 py-2 text-xs font-semibold text-white hover:bg-slate-900"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredDoctors.map((doctor) => {
              const doctorId = doctor._id;

              return (
                <Card
                  key={doctorId}
                  className="border-slate-200 bg-white shadow-[0_10px_36px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.08)]"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 text-base font-semibold text-white shadow-sm">
                          {resolveDoctorName(doctor)
                            .split(" ")
                            .map((word) => word[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>
                        <h2 className="mt-4 text-lg font-semibold tracking-tight text-slate-950">
                          {resolveDoctorName(doctor)}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">{doctor.specialization ?? "Specialist"}</p>
                      </div>

                      <Badge
                        variant={doctor.isAvailable ? "default" : "outline"}
                        className={
                          doctor.isAvailable
                            ? "rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                            : "rounded-full border-slate-200 text-slate-500"
                        }
                      >
                        {formatAvailabilityLabel(doctor.isAvailable)}
                      </Badge>
                    </div>

                    {state.availabilityByDoctorId[doctorId]?.length ? (
                      <div className="mt-4 inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700">
                        {getNextAvailabilityLabel(state.availabilityByDoctorId[doctorId])}
                      </div>
                    ) : (
                      <div className="mt-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
                        No availability schedule yet
                      </div>
                    )}

                    <div className="mt-5 space-y-3 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Building2 className="size-4 text-sky-600" />
                        <span>{resolveDepartmentName(doctor)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="size-4 text-sky-600" />
                        <span>{formatExperience(doctor.experienceYears)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex size-4 items-center justify-center rounded-full bg-sky-50 text-[10px] font-bold text-sky-700">
                          Rs
                        </span>
                        <span>{formatCurrency(doctor.consultationFee)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex size-4 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                          {resolveClinicName(doctor).slice(0, 1)}
                        </span>
                        <span>{resolveClinicName(doctor)}</span>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-3">
                      <p className="text-xs text-slate-500">{doctor.bio ? doctor.bio.slice(0, 74) : "Live profile available from the backend."}</p>
                      <Link
                        href={buildDoctorDetailHref(doctorId, state)}
                        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#020617] px-4 py-2.5 text-sm font-semibold !text-white hover:bg-[#020617] hover:!text-white"
                        style={{ color: "#ffffff" }}
                      >
                        View details <ArrowRight className="size-4 text-white" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredDoctors.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">No doctors found</p>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">Try a different search or filter</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                No doctors match the current department, search term, or sort combination right now.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
