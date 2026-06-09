import * as bcrypt from "bcryptjs";
import { Types } from "mongoose";

import { DoctorModel } from "../models/Doctor.model.js";
import { UserModel } from "../models/User.model.js";
import { AppError } from "../utils/appError.js";

function doctorPopulateFields() {
  return "name email phone avatar role isActive createdAt updatedAt";
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === "string" ? Number(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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

export async function createDoctorAccount(input: {
  userId?: string;
  name?: string;
  email?: string;
  password?: string;
  avatar?: string;
  clinicId?: string;
  departmentId?: string;
  specialization?: string;
  qualification?: string;
  address?: string;
  experienceYears?: number | string;
  consultationFee?: number | string;
  bio?: string;
  languages?: string[];
  status?: "pending" | "active";
}) {
  const normalizedStatus = input.status === "active" ? "active" : "pending";
  type DoctorUserRecord = {
    _id: Types.ObjectId;
    role: string;
  };

  let user: DoctorUserRecord | null = null;
  let createdUserId: string | null = null;

  try {
    if (input.userId) {
      user = (await UserModel.findById(input.userId)) as DoctorUserRecord | null;

      if (!user) {
        throw new AppError("Linked user not found", 404);
      }

      if (user.role !== "doctor") {
        throw new AppError("Linked user must have doctor role", 400);
      }
    } else {
      const name = input.name?.trim();
      const email = input.email?.trim().toLowerCase();
      const password = input.password;

      if (!name || !email || !password) {
        throw new AppError("name, email, and password are required", 400);
      }

      const existingUser = await UserModel.findOne({ email }).lean();
      if (existingUser) {
        throw new AppError("Email already in use", 409);
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      user = (await UserModel.create({
        name,
        email,
        password: hashedPassword,
        avatar: input.avatar?.trim() || undefined,
        role: "doctor",
        isActive: true,
      })) as DoctorUserRecord;

      createdUserId = user._id.toString();
    }

    if (!user) {
      throw new AppError("Doctor user could not be prepared", 500);
    }

    const existingDoctor = await DoctorModel.findOne({ userId: user._id });
    if (existingDoctor) {
      throw new AppError("Doctor profile already exists for this user", 409);
    }

    const doctor = await DoctorModel.create({
      userId: user._id,
      clinicId: input.clinicId,
      departmentId: input.departmentId,
      specialization: input.specialization?.trim() || "General Practice",
      qualification: input.qualification?.trim() || undefined,
      address: input.address?.trim() || undefined,
      experienceYears: toNumber(input.experienceYears, 0),
      consultationFee: toNumber(input.consultationFee, 0),
      bio: input.bio?.trim() || undefined,
      languages: input.languages,
      profileStatus: normalizedStatus === "active" ? "approved" : "pending",
      isPublic: normalizedStatus === "active",
      isAvailable: normalizedStatus === "active",
    });

    const populatedDoctor = await DoctorModel.findById(doctor._id)
      .populate("userId", doctorPopulateFields())
      .populate("clinicId", "name city")
      .populate("departmentId", "name description");

    if (!populatedDoctor) {
      throw new AppError("Doctor profile could not be created", 500);
    }

    return populatedDoctor;
  } catch (error) {
    if (createdUserId) {
      await UserModel.findByIdAndDelete(createdUserId);
    }

    throw error;
  }
}
