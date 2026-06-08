import { BarChart3, Building2, CalendarDays, Layers3, LayoutDashboard, Stethoscope } from "lucide-react";

export type DoctorDashboardShellConfig = {
  expectedRole: "clinic_admin" | "super_admin";
  roleLabel: string;
  accent: string;
  title: string;
  subtitle: string;
  basePath: "/admin" | "/superadmin";
  navItems: { label: string; icon: typeof LayoutDashboard }[];
};

export function getDoctorDashboardConfig(role: "clinic_admin" | "super_admin"): DoctorDashboardShellConfig {
  if (role === "super_admin") {
    return {
      expectedRole: "super_admin",
      roleLabel: "Super Admin Dashboard",
      accent: "Super Admin",
      title: "Monitor platform operations and governance.",
      subtitle: "This workspace keeps the superadmin interface focused on overview, doctors, departments, appointments, and reports.",
      basePath: "/superadmin",
      navItems: [
        { label: "Overview", icon: LayoutDashboard },
        { label: "Doctors", icon: Stethoscope },
        { label: "Departments", icon: Layers3 },
        { label: "Appointments", icon: CalendarDays },
        { label: "Reports", icon: BarChart3 },
      ],
    };
  }

  return {
    expectedRole: "clinic_admin",
    roleLabel: "Clinic Admin Dashboard",
    accent: "Clinic Admin",
    title: "Run clinic operations from a structured dashboard shell.",
    subtitle:
      "This workspace will expand into doctor management, departments, appointments, patient oversight, and clinic-level reporting.",
    basePath: "/admin",
    navItems: [
      { label: "Overview", icon: LayoutDashboard },
      { label: "Doctors", icon: Stethoscope },
      { label: "Departments", icon: Building2 },
      { label: "Appointments", icon: CalendarDays },
      { label: "Reports", icon: BarChart3 },
    ],
  };
}
