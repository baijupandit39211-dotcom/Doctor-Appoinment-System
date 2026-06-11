import { PatientModel } from "../models/Patient.model.js";
import { UserModel } from "../models/User.model.js";
import { type Gender, genders } from "../models/types.js";
import { AppError } from "../utils/appError.js";

function patientPopulateFields() {
  return "name email phone avatar role isActive createdAt updatedAt";
}

export async function getOrCreatePatientProfile(userId: string) {
  const existingPatient = await PatientModel.findOne({ userId }).populate("userId", patientPopulateFields());

  if (existingPatient) {
    return existingPatient;
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.role !== "patient") {
    throw new AppError("User must have patient role", 400);
  }

  const createdPatient = await PatientModel.create({ userId });
  const hydratedPatient = await PatientModel.findById(createdPatient._id).populate("userId", patientPopulateFields());

  if (!hydratedPatient) {
    throw new AppError("Patient profile could not be created", 500);
  }

  return hydratedPatient;
}

export async function getPatientProfile(userId: string) {
  const patient = await PatientModel.findOne({ userId }).populate("userId", patientPopulateFields());

  if (!patient) {
    throw new AppError("Patient profile not found", 404);
  }

  return patient;
}

export async function updatePatientProfile(
  userId: string,
  input: {
    name?: string;
    phone?: string;
    avatar?: string;
    dateOfBirth?: string;
    gender?: Gender | "";
    address?: string;
  },
) {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.role !== "patient") {
    throw new AppError("User must have patient role", 400);
  }

  let patient = await PatientModel.findOne({ userId });
  if (!patient) {
    patient = await PatientModel.create({ userId });
  }

  if (input.name !== undefined) {
    user.name = input.name.trim();
  }

  if (input.phone !== undefined) {
    user.phone = input.phone.trim() || undefined;
  }

  if (input.avatar !== undefined) {
    user.avatar = input.avatar.trim() || undefined;
  }

  if (input.dateOfBirth !== undefined) {
    if (!input.dateOfBirth.trim()) {
      patient.dateOfBirth = undefined;
    } else {
      const parsedDate = new Date(input.dateOfBirth);
      if (Number.isNaN(parsedDate.getTime())) {
        throw new AppError("Invalid date of birth", 400);
      }

      patient.dateOfBirth = parsedDate;
    }
  }

  if (input.gender !== undefined) {
    const normalizedGender = input.gender.trim().toLowerCase();
    patient.gender = normalizedGender && genders.includes(normalizedGender as Gender) ? (normalizedGender as Gender) : undefined;
  }

  if (input.address !== undefined) {
    patient.address = input.address.trim() || undefined;
  }

  await Promise.all([user.save(), patient.save()]);

  const hydratedPatient = await PatientModel.findById(patient._id).populate("userId", patientPopulateFields());
  if (!hydratedPatient) {
    throw new AppError("Patient profile could not be updated", 500);
  }

  return hydratedPatient;
}
