import { DoctorModel } from "../models/Doctor.model.js";
import { UserModel } from "../models/User.model.js";
import { AppError } from "../utils/appError.js";

function doctorPopulateFields() {
  return "name email phone avatar role isActive createdAt updatedAt";
}

export async function getOrCreateDoctorProfile(userId: string) {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.role !== "doctor") {
    throw new AppError("User must have doctor role", 400);
  }

  const hydratedDoctor = await DoctorModel.findOneAndUpdate(
    { userId },
    {
      $setOnInsert: {
        userId,
        specialization: "General Practice",
        profileStatus: "pending",
        isPublic: false,
        isAvailable: false,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  ).populate("userId", doctorPopulateFields());

  if (!hydratedDoctor) {
    throw new AppError("Doctor profile could not be created", 500);
  }

  return hydratedDoctor;
}

export async function getDoctorProfile(userId: string) {
  const doctor = await DoctorModel.findOne({ userId }).populate("userId", doctorPopulateFields());

  if (!doctor) {
    throw new AppError("Doctor profile not found", 404);
  }

  return doctor;
}
