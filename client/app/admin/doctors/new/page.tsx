"use client";

import { DoctorUpsertPage } from "@/components/dashboard/doctor-upsert-page";
import { getDoctorDashboardConfig } from "@/components/dashboard/doctor-dashboard-config";

export default function AdminDoctorCreatePage() {
  const config = getDoctorDashboardConfig("clinic_admin");

  return (
    <DoctorUpsertPage
      expectedRole="clinic_admin"
      roleLabel={config.roleLabel}
      accent={config.accent}
      title={config.title}
      subtitle={config.subtitle}
      navItems={config.navItems}
      basePath={config.basePath}
      mode="create"
    />
  );
}
