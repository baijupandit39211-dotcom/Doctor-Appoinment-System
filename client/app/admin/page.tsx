"use client";

import { DashboardRoutePage } from "@/components/dashboard/dashboard-route-page";
import { CalendarDays, LayoutDashboard, Stethoscope, BarChart3, Building2, UserPlus } from "lucide-react";

export default function AdminPage() {
  return (
    <DashboardRoutePage
      config={{
        expectedRole: "clinic_admin",
        roleLabel: "Clinic Admin Dashboard",
        accent: "Clinic Admin",
        title: "Run clinic operations from a structured dashboard shell.",
        subtitle:
          "This workspace will expand into doctor management, departments, appointments, patient oversight, and clinic-level reporting.",
        navItems: [
          { label: "Overview", icon: LayoutDashboard },
          { label: "Doctors", icon: Stethoscope },
          { label: "Add Doctor", icon: UserPlus, href: "/admin/doctors/new" },
          { label: "Departments", icon: Building2 },
          { label: "Appointments", icon: CalendarDays },
          { label: "Reports", icon: BarChart3 },
        ],
        primaryActionLabel: "Manage doctors",
        secondaryActionLabel: "View reports",
      }}
    />
  );
}
