"use client";

import { DashboardRoutePage } from "@/components/dashboard/dashboard-route-page";
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  Layers3,
  Stethoscope,
} from "lucide-react";

export default function SuperAdminPage() {
  return (
    <DashboardRoutePage
      config={{
        expectedRole: "super_admin",
        roleLabel: "Super Admin Dashboard",
        accent: "Super Admin",
        title: "Monitor platform operations and governance.",
        subtitle:
          "This workspace keeps the superadmin interface focused on overview, doctors, departments, appointments, and reports.",
        navItems: [
          { label: "Overview", icon: LayoutDashboard },
          { label: "Doctors", icon: Stethoscope },
          { label: "Departments", icon: Layers3 },
          { label: "Appointments", icon: CalendarDays },
          { label: "Reports", icon: BarChart3 },
        ],
        primaryActionLabel: "Open doctors",
        secondaryActionLabel: "Open reports",
      }}
    />
  );
}
