"use client";

import { DoctorUpsertPage } from "@/components/dashboard/doctor-upsert-page";
import { getDoctorDashboardConfig } from "@/components/dashboard/doctor-dashboard-config";

export default function SuperAdminDoctorCreatePage() {
  const config = getDoctorDashboardConfig("super_admin");

  return (
    <DoctorUpsertPage
      expectedRole="super_admin"
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
