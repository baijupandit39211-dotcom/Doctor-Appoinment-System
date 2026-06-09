"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CalendarDays, HeartPulse, MapPin, ShieldCheck, Stethoscope } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { requestJson } from "@/lib/api-client";
import { type AuthUser } from "@/lib/auth";

import {
  type AvailabilityRecord,
  type DoctorRecord,
  formatCurrency,
  formatExperience,
  getNextAvailabilityLabel,
  formatScheduleLabel,
  loadCurrentUserSafe,
  resolveClinicName,
  resolveDepartmentName,
  resolveDoctorName,
} from "./doctor-helpers";

type DoctorDetailPageProps = {
  doctorId: string;
};

type AppointmentFormState = {
  appointmentDate: string;
  startTime: string;
  reason: string;
};

export function DoctorDetailPage({ doctorId }: DoctorDetailPageProps) {
  const searchParams = useSearchParams();
  const [doctor, setDoctor] = useState<DoctorRecord | null>(null);
  const [availability, setAvailability] = useState<AvailabilityRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [form, setForm] = useState<AppointmentFormState>({
    appointmentDate: "",
    startTime: "",
    reason: "",
  });

  useEffect(() => {
    let active = true;

    async function loadDoctorDetail() {
      try {
        const [doctorResponse, availabilityResponse, user] = await Promise.all([
          requestJson<DoctorRecord>(`/api/doctors/${doctorId}`),
          requestJson<AvailabilityRecord[]>(`/api/availability/doctor/${doctorId}`),
          loadCurrentUserSafe(),
        ]);

        if (!active) {
          return;
        }

        setDoctor(doctorResponse.data ?? null);
        setAvailability(availabilityResponse.data ?? []);
        setCurrentUser(user);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load doctor details");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadDoctorDetail();

    return () => {
      active = false;
    };
  }, [doctorId]);

  const isPatientAccount = currentUser?.role === "patient";
  const returnToDoctorsHref = searchParams.toString() ? `/doctors?${searchParams.toString()}` : "/doctors";

  async function handleBookingSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!doctor) {
      return;
    }

    if (!currentUser) {
      setError("Please sign in before booking an appointment.");
      return;
    }

    if (!isPatientAccount) {
      setError("Only patient accounts can book appointments.");
      return;
    }

    if (!form.appointmentDate || !form.startTime || !form.reason.trim()) {
      setError("Date, start time, and reason are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await requestJson<{ _id?: string; status?: string }>("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          patientId: currentUser.id,
          doctorId,
          appointmentDate: form.appointmentDate,
          startTime: form.startTime,
          reason: form.reason.trim(),
        }),
      });

      setSuccessMessage(response.message ?? "Appointment request submitted successfully.");
      setForm({
        appointmentDate: "",
        startTime: "",
        reason: "",
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Booking failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_34%),linear-gradient(180deg,#f8fbff_0%,#ffffff_62%)] px-5 py-10 text-slate-900 sm:px-8">
        <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center">
          <Card className="w-full max-w-xl border-slate-200 bg-white/90 shadow-sm">
            <CardContent className="py-12 text-center">
              <div className="mx-auto size-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />
              <p className="mt-4 text-sm font-medium text-slate-600">Loading doctor details...</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (error && !doctor) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_34%),linear-gradient(180deg,#f8fbff_0%,#ffffff_62%)] px-5 py-10 text-slate-900 sm:px-8">
        <div className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center">
          <Card className="w-full border-slate-200 bg-white shadow-sm">
            <CardContent className="py-12 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Doctor error</p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight">Unable to load the doctor profile</h1>
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
                  href={returnToDoctorsHref}
                  className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Back to doctors
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (!doctor) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_34%),linear-gradient(180deg,#f8fbff_0%,#ffffff_62%)] px-5 py-8 text-slate-900 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <Link href={returnToDoctorsHref} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                ← Back to doctors
              </Link>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Badge className="rounded-full bg-sky-50 px-3 py-1 text-sky-700 hover:bg-sky-50">
                  <Stethoscope className="mr-1 size-3.5" />
                  Doctor profile
                </Badge>
                <Badge
                  variant={doctor.isAvailable ? "default" : "outline"}
                  className={
                    doctor.isAvailable
                      ? "rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                      : "rounded-full border-slate-200 text-slate-500"
                  }
                >
                  {doctor.isAvailable ? "Accepting appointments" : "Currently unavailable"}
                </Badge>
                {availability.length > 0 ? (
                  <Badge className="rounded-full border-sky-200 bg-sky-50 px-3 py-1 text-sky-700 hover:bg-sky-50">
                    {getNextAvailabilityLabel(availability)}
                  </Badge>
                ) : null}
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {resolveDoctorName(doctor)}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                {doctor.bio ??
                  "Review the live doctor profile, availability schedule, and book a slot directly from this page."}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Department</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{resolveDepartmentName(doctor)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Clinic</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{resolveClinicName(doctor)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Experience</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {doctor.experienceYears ?? 0} year{doctor.experienceYears === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Consultation fee</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{formatCurrency(doctor.consultationFee)}</p>
                </div>
              </div>
            </div>

            <Card className="w-full border-slate-200 bg-slate-950 text-white shadow-[0_18px_40px_rgba(15,23,42,0.14)] lg:max-w-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="grid size-12 place-items-center rounded-2xl bg-white/10">
                    <HeartPulse className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Live booking</p>
                    <p className="text-xs text-white/70">Simple booking foundation</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm text-white/80">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4" />
                    <span>Protected booking with backend auth cookie</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="size-4" />
                    <span>Availability is loaded from the live API</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4" />
                    <span>{resolveClinicName(doctor)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-10 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-xl text-slate-950">Availability schedule</CardTitle>
                <CardDescription>
                  Slots returned by <span className="font-medium text-slate-700">/api/availability/doctor/:doctorId</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {availability.length > 0 ? (
                  <div className="space-y-4">
                    {availability.map((slot) => (
                      <div
                        key={slot._id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.03)]"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">{formatScheduleLabel(slot)}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {slot.slotDurationMinutes ? `${slot.slotDurationMinutes}-minute slots` : "Slot duration not specified"}
                            </p>
                          </div>
                          <Badge
                            variant={slot.isActive ? "default" : "outline"}
                            className={
                              slot.isActive
                                ? "rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                                : "rounded-full border-slate-200 text-slate-500"
                            }
                          >
                            {slot.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {slot.clinicId && typeof slot.clinicId === "object" && "name" in slot.clinicId ? (
                          <p className="mt-3 text-sm text-slate-600">
                            {slot.clinicId.name}
                            {slot.clinicId.city ? ` · ${slot.clinicId.city}` : ""}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <p className="text-sm font-semibold text-slate-950">No schedule published yet</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      The backend did not return active availability for this doctor.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-xl text-slate-950">Book an appointment</CardTitle>
                <CardDescription>
                  Fill the date, start time, and reason to create an appointment request.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {!currentUser ? (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-950">You are not signed in</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Sign in to book this doctor and submit the request through the backend.
                    </p>
                    <Link
                      href="/login"
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Go to login <ArrowRight className="size-4" />
                    </Link>
                  </div>
                ) : !isPatientAccount ? (
                  <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
                    <p className="text-sm font-semibold">Booking is available for patient accounts only.</p>
                    <p className="mt-2 text-sm leading-6 text-amber-800">
                      You are signed in as <span className="font-semibold">{currentUser.role}</span>. Switch to a patient
                      account to book an appointment.
                    </p>
                  </div>
                ) : (
                  <form className="space-y-4" onSubmit={handleBookingSubmit}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-900">Date</span>
                        <Input
                          type="date"
                          value={form.appointmentDate}
                          onChange={(event) =>
                            setForm((currentForm) => ({ ...currentForm, appointmentDate: event.target.value }))
                          }
                          className="h-12 rounded-2xl border-slate-300 bg-slate-50"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-900">Start time</span>
                        <Input
                          type="time"
                          value={form.startTime}
                          onChange={(event) =>
                            setForm((currentForm) => ({ ...currentForm, startTime: event.target.value }))
                          }
                          className="h-12 rounded-2xl border-slate-300 bg-slate-50"
                        />
                      </label>
                    </div>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-slate-900">Reason</span>
                      <Textarea
                        value={form.reason}
                        onChange={(event) => setForm((currentForm) => ({ ...currentForm, reason: event.target.value }))}
                        placeholder="Tell the doctor briefly why you need the appointment"
                        className="min-h-[120px] rounded-2xl border-slate-300 bg-slate-50"
                      />
                    </label>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      <p className="font-semibold text-slate-950">Booking note</p>
                      <p className="mt-2 leading-6">
                        The form posts directly to the backend appointment endpoint. If the patient profile is not yet
                        linked in the database, the backend may reject the request.
                      </p>
                    </div>

                    {error ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                      </div>
                    ) : null}

                    {successMessage ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {successMessage}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSubmitting ? "Submitting..." : "Book appointment"}
                      {!isSubmitting ? <ArrowRight className="size-4" /> : null}
                    </button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold text-slate-950">Live details</p>
              <Badge variant="outline" className="rounded-full border-slate-200 text-slate-600">
                {doctor.consultationFee ? `Fee ${formatCurrency(doctor.consultationFee)}` : "Fee not published"}
              </Badge>
              <Badge variant="outline" className="rounded-full border-slate-200 text-slate-600">
                {doctor.experienceYears ? formatExperience(doctor.experienceYears) : "Experience not listed"}
              </Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {availability.length > 0
                ? `Schedule loaded for ${availability.length} availability slot${availability.length === 1 ? "" : "s"}.`
                : "Availability has not been published yet for this doctor."}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
