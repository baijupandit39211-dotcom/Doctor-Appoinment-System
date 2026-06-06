"use client";

import { DashboardRoutePage } from "@/components/dashboard/dashboard-route-page";
import { CalendarDays, Clock3, LayoutDashboard, UserCircle2, Users } from "lucide-react";

export default function DoctorPage() {
  return (
    <DashboardRoutePage
      config={{
        expectedRole: "doctor",
        roleLabel: "Doctor Dashboard",
        accent: "Doctor",
        title: "Review appointments and manage availability.",
        subtitle:
          "This shell is the base for doctor workflows: today’s appointments, availability slots, patient follow-ups, and appointment status updates.",
        navItems: [
          { label: "Overview", icon: LayoutDashboard },
          { label: "Appointments", icon: CalendarDays },
          { label: "Availability", icon: Clock3 },
          { label: "Patients", icon: Users },
          { label: "Profile", icon: UserCircle2 },
        ],
        primaryActionLabel: "Manage availability",
        secondaryActionLabel: "View appointments",
      }}
    />
  );
}
