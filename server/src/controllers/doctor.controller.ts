import type { NextFunction, Request, Response } from "express";
import * as bcrypt from "bcryptjs";

import { DoctorModel } from "../models/Doctor.model.js";
import { UserModel } from "../models/User.model.js";
import { createDoctorAccount } from "../services/doctor.service.js";
import { queueNotificationForDoctorUser } from "../services/notification.service.js";
import { AppError } from "../utils/appError.js";

function getDoctorIdParams(req: Request) {
  const doctorId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!doctorId) {
    throw new AppError("Doctor id is required", 400);
  }
  return doctorId;
}

async function ensureDoctorUserExists(userId: unknown) {
  if (!userId || typeof userId !== "string") {
    throw new AppError("userId is required", 400);
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError("Linked user not found", 404);
  }

  if (user.role !== "doctor") {
    throw new AppError("Linked user must have doctor role", 400);
  }

  return user;
}

function isAdminRole(role?: string) {
  return role === "clinic_admin" || role === "super_admin";
}

async function populateDoctorById(doctorId: string) {
  const doctor = await DoctorModel.findById(doctorId)
    .populate("userId", "name email phone avatar role")
    .populate("clinicId", "name city")
    .populate("departmentId", "name description");

  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  return doctor;
}

function normalizeDoctorStatus(status?: string) {
  if (status === "active") {
    return "approved";
  }

  if (status === "pending") {
    return "pending";
  }

  if (status === "rejected") {
    return "rejected";
  }

  return undefined;
}

export async function listDoctors(_req: Request, res: Response, next: NextFunction) {
  try {
    const filters: Record<string, unknown> = {
      isPublic: true,
      profileStatus: "approved",
      isAvailable: true,
    };

    const doctors = await DoctorModel.find(filters)
      .sort({ createdAt: -1 })
      .populate("userId", "name email phone avatar role")
      .populate("clinicId", "name city")
      .populate("departmentId", "name description");

    res.status(200).json({
      success: true,
      message: "Doctors fetched successfully",
      data: doctors,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDoctorById(req: Request, res: Response, next: NextFunction) {
  try {
    const doctorId = getDoctorIdParams(req);
    const doctor = await populateDoctorById(doctorId);

    const isVisible = doctor.isPublic && doctor.profileStatus === "approved" && doctor.isAvailable;
    const canViewHiddenDoctor = req.user && isAdminRole(req.user.role);

    if (!isVisible && !canViewHiddenDoctor) {
      throw new AppError("Doctor not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Doctor fetched successfully",
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
}

export async function listAllDoctors(_req: Request, res: Response, next: NextFunction) {
  try {
    const doctors = await DoctorModel.find()
      .sort({ createdAt: -1 })
      .populate("userId", "name email phone avatar role")
      .populate("clinicId", "name city")
      .populate("departmentId", "name description");

    res.status(200).json({
      success: true,
      message: "Doctors fetched successfully",
      data: doctors,
    });
  } catch (error) {
    next(error);
  }
}

export async function createDoctor(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      userId,
      name,
      email,
      password,
      avatar,
      clinicId,
      departmentId,
      specialization,
      qualification,
      address,
      experienceYears,
      consultationFee,
      bio,
      languages,
      status,
    } = req.body ?? {};

    if (!userId && (!name || !email || !password)) {
      throw new AppError("name, email, and password are required", 400);
    }

    const doctor = await createDoctorAccount({
      userId,
      name,
      email,
      password,
      avatar,
      clinicId,
      departmentId,
      specialization,
      qualification,
      address,
      experienceYears,
      consultationFee,
      bio,
      languages,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Doctor created successfully",
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateDoctor(req: Request, res: Response, next: NextFunction) {
  try {
    const doctorId = getDoctorIdParams(req);

    const doctor = await DoctorModel.findById(doctorId);
    if (!doctor) {
      throw new AppError("Doctor not found", 404);
    }

    const body = req.body ?? {};
    const {
      userId,
      name,
      email,
      password,
      avatar,
      status,
      ...doctorFields
    } = body;

    if (userId) {
      await ensureDoctorUserExists(userId);
      doctor.userId = userId;
    }

    const linkedUserId = typeof doctor.userId === "string" ? doctor.userId : doctor.userId?.toString?.() ?? "";
    if (linkedUserId && (name || email || password || avatar !== undefined)) {
      const linkedUser = await UserModel.findById(linkedUserId).select("+password");
      if (!linkedUser) {
        throw new AppError("Linked user not found", 404);
      }

      if (name?.trim()) {
        linkedUser.name = name.trim();
      }

      if (email?.trim()) {
        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await UserModel.findOne({ email: normalizedEmail, _id: { $ne: linkedUser._id } }).lean();
        if (existingUser) {
          throw new AppError("Email already in use", 409);
        }
        linkedUser.email = normalizedEmail;
      }

      if (password?.trim()) {
        linkedUser.password = await bcrypt.hash(password, 12);
      }

      if (avatar !== undefined) {
        linkedUser.avatar = avatar?.trim() || undefined;
      }

      await linkedUser.save();
    }

    const mappedStatus = normalizeDoctorStatus(status);
    const updatePayload: Record<string, unknown> = {
      ...doctorFields,
    };

    if (mappedStatus === "approved") {
      updatePayload.profileStatus = "approved";
      updatePayload.isPublic = true;
      updatePayload.isAvailable = true;
    } else if (mappedStatus === "pending") {
      updatePayload.profileStatus = "pending";
      updatePayload.isPublic = false;
      updatePayload.isAvailable = false;
    } else if (mappedStatus === "rejected") {
      updatePayload.profileStatus = "rejected";
      updatePayload.isPublic = false;
      updatePayload.isAvailable = false;
    }

    if (updatePayload.departmentId === "") {
      updatePayload.departmentId = undefined;
    }
    if (updatePayload.clinicId === "") {
      updatePayload.clinicId = undefined;
    }

    Object.assign(doctor, updatePayload);
    await doctor.save();

    const populatedDoctor = await DoctorModel.findById(doctorId)
      .populate("userId", "name email phone avatar role")
      .populate("clinicId", "name city")
      .populate("departmentId", "name description");

    res.status(200).json({
      success: true,
      message: "Doctor updated successfully",
      data: populatedDoctor ?? doctor,
    });
  } catch (error) {
    next(error);
  }
}

export async function approveDoctor(req: Request, res: Response, next: NextFunction) {
  try {
    const doctorId = getDoctorIdParams(req);

    const doctor = await DoctorModel.findByIdAndUpdate(
      doctorId,
      {
        profileStatus: "approved",
        isPublic: true,
        isAvailable: true,
      },
      { new: true, runValidators: true },
    )
      .populate("userId", "name email phone avatar role")
      .populate("clinicId", "name city")
      .populate("departmentId", "name description");

    if (!doctor) {
      throw new AppError("Doctor not found", 404);
    }

    const doctorUserId = typeof doctor.userId === "object" && doctor.userId && "_id" in doctor.userId
      ? doctor.userId._id.toString()
      : "";

    if (doctorUserId) {
      await queueNotificationForDoctorUser(doctorUserId, {
        title: "Doctor profile approved",
        message: "Your doctor profile has been approved and is now visible publicly.",
        type: "system",
      });
    }

    res.status(200).json({
      success: true,
      message: "Doctor approved successfully",
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
}

export async function unpublishDoctor(req: Request, res: Response, next: NextFunction) {
  try {
    const doctorId = getDoctorIdParams(req);

    const doctor = await DoctorModel.findByIdAndUpdate(
      doctorId,
      {
        isPublic: false,
      },
      { new: true, runValidators: true },
    )
      .populate("userId", "name email phone avatar role")
      .populate("clinicId", "name city")
      .populate("departmentId", "name description");

    if (!doctor) {
      throw new AppError("Doctor not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Doctor unpublished successfully",
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
}

export async function rejectDoctor(req: Request, res: Response, next: NextFunction) {
  try {
    const doctorId = getDoctorIdParams(req);

    const doctor = await DoctorModel.findByIdAndUpdate(
      doctorId,
      {
        profileStatus: "rejected",
        isPublic: false,
        isAvailable: false,
      },
      { new: true, runValidators: true },
    )
      .populate("userId", "name email phone avatar role")
      .populate("clinicId", "name city")
      .populate("departmentId", "name description");

    if (!doctor) {
      throw new AppError("Doctor not found", 404);
    }

    const doctorUserId = typeof doctor.userId === "object" && doctor.userId && "_id" in doctor.userId
      ? doctor.userId._id.toString()
      : "";

    if (doctorUserId) {
      await queueNotificationForDoctorUser(doctorUserId, {
        title: "Doctor profile rejected",
        message: "Your doctor profile has been rejected and is no longer public.",
        type: "system",
      });
    }

    res.status(200).json({
      success: true,
      message: "Doctor rejected successfully",
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteDoctor(req: Request, res: Response, next: NextFunction) {
  try {
    const doctorId = getDoctorIdParams(req);

    const doctor = await DoctorModel.findByIdAndDelete(doctorId);
    if (!doctor) {
      throw new AppError("Doctor not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Doctor deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}
