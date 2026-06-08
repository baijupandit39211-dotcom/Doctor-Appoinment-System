"use client";

import { useParams } from "next/navigation";

import { DoctorUpsertPage } from "@/components/dashboard/doctor-upsert-page";
import { getDoctorDashboardConfig } from "@/components/dashboard/doctor-dashboard-config";

export default function SuperAdminDoctorEditPage() {
  const params = useParams<{ id?: string | string[] }>();
  const doctorId = Array.isArray(params.id) ? params.id[0] : params.id;
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
      mode="edit"
      doctorId={doctorId}
    />
  );
}
