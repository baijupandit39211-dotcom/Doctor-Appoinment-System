import { connectDatabase } from "../config/database.js";
import { env } from "../config/env.js";
import { ClinicModel } from "../models/Clinic.model.js";
import { DepartmentModel } from "../models/Department.model.js";
import { DoctorModel } from "../models/Doctor.model.js";

const demoClinicName = "DocPulse Demo Clinic";

type SeedDepartment = {
  name: string;
  description: string;
};

const seedDepartments: SeedDepartment[] = [
  {
    name: "General Medicine",
    description: "Primary care, routine consultations, and general medical support.",
  },
  {
    name: "Cardiology",
    description: "Heart and cardiovascular care for patients who need specialist review.",
  },
  {
    name: "Dermatology",
    description: "Skin, hair, and nail care for routine and specialist treatment.",
  },
  {
    name: "Pediatrics",
    description: "Healthcare services for infants, children, and adolescents.",
  },
];

function ensureDevOnly() {
  if (env.NODE_ENV === "production") {
    throw new Error("Department seeding is disabled in production.");
  }
}

async function getOrCreateDemoClinic() {
  const existingClinic = await ClinicModel.findOne({ name: demoClinicName });
  if (existingClinic) {
    return existingClinic;
  }

  return ClinicModel.create({
    name: demoClinicName,
    email: "demo@docpulse.local",
    city: "Demo City",
    address: "Local development clinic",
    isActive: true,
  });
}

async function seedDepartmentsForClinic(clinicId: string) {
  const results: Array<{ name: string; action: "created" | "existing" }> = [];

  for (const department of seedDepartments) {
    const existingDepartment = await DepartmentModel.findOne({ clinicId, name: department.name });

    if (existingDepartment) {
      results.push({ name: department.name, action: "existing" });
      continue;
    }

    await DepartmentModel.create({
      clinicId,
      name: department.name,
      description: department.description,
      isActive: true,
    });

    results.push({ name: department.name, action: "created" });
  }

  return results;
}

async function linkUnassignedDoctorsToGeneralMedicine(clinicId: string) {
  const generalMedicineDepartment = await DepartmentModel.findOne({ clinicId, name: "General Medicine" });

  if (!generalMedicineDepartment) {
    return 0;
  }

  const updateResult = await DoctorModel.updateMany(
    { clinicId, $or: [{ departmentId: { $exists: false } }, { departmentId: null }] },
    { $set: { departmentId: generalMedicineDepartment._id } },
  );

  return updateResult.modifiedCount ?? 0;
}

async function main() {
  ensureDevOnly();
  await connectDatabase();

  const clinic = await getOrCreateDemoClinic();
  const departmentResults = await seedDepartmentsForClinic(clinic._id.toString());
  const linkedDoctors = await linkUnassignedDoctorsToGeneralMedicine(clinic._id.toString());

  console.log(`Seeded demo departments for clinic: ${clinic.name}`);
  for (const result of departmentResults) {
    console.log(`- ${result.name}: ${result.action}`);
  }
  console.log(`Linked ${linkedDoctors} doctor(s) without a department to General Medicine.`);

  process.exit(0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
