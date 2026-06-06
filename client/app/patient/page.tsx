"use client";

import { DashboardRoutePage } from "@/components/dashboard/dashboard-route-page";
import { BellRing, CalendarDays, LayoutDashboard, Stethoscope, UserCircle2 } from "lucide-react";

export default function PatientPage() {
  return (
    <DashboardRoutePage
      config={{
        expectedRole: "patient",
        roleLabel: "Patient Dashboard",
        accent: "Patient",
        title: "Manage appointments and follow-ups in one place.",
        subtitle:
          "This is the first real shell for the patient experience. The next step will connect live appointments, booking flow, and profile data.",
        navItems: [
          { label: "Overview", icon: LayoutDashboard },
          { label: "Appointments", icon: CalendarDays },
          { label: "Doctors", icon: Stethoscope },
          { label: "Notifications", icon: BellRing },
          { label: "Profile", icon: UserCircle2 },
        ],
        primaryActionLabel: "Book appointment",
        secondaryActionLabel: "View history",
      }}
    />
  );
}
