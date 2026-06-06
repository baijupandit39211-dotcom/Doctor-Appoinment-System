import { DoctorsPage } from "@/components/doctors/doctors-page";

type DoctorsRoutePageProps = {
  searchParams?: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>;
};

function firstSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeSortValue(value: string | string[] | undefined) {
  const current = firstSearchValue(value);

  if (current === "experience_desc" || current === "fee_asc" || current === "fee_desc") {
    return current;
  }

  return "featured";
}

export default async function DoctorsRoutePage({ searchParams }: DoctorsRoutePageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const sortBy = normalizeSortValue(resolvedSearchParams.sort);

  return (
    <DoctorsPage
      initialSearchQuery={firstSearchValue(resolvedSearchParams.q) ?? ""}
      initialDepartmentId={firstSearchValue(resolvedSearchParams.department) ?? "all"}
      initialSortBy={sortBy}
    />
  );
}
