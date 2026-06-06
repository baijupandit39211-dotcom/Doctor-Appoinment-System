import { PatientModel } from "../models/Patient.model.js";
import { UserModel } from "../models/User.model.js";
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
