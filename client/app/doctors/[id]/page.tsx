import { DoctorDetailPage } from "@/components/doctors/doctor-detail-page";

type DoctorDetailRoutePageProps = {
  params: Promise<{ id: string }>;
};

export default async function DoctorDetailRoutePage({ params }: DoctorDetailRoutePageProps) {
  const resolvedParams = await params;
  return <DoctorDetailPage doctorId={resolvedParams.id} />;
}
