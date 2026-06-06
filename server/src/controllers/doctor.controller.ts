import type { NextFunction, Request, Response } from "express";

import { DoctorModel } from "../models/Doctor.model.js";
import { UserModel } from "../models/User.model.js";
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
    const { userId, clinicId, departmentId, specialization, qualification, experienceYears, consultationFee, bio, languages, isAvailable } =
      req.body ?? {};

    if (!userId || !specialization) {
      throw new AppError("userId and specialization are required", 400);
    }

    await ensureDoctorUserExists(userId);

    const existingDoctor = await DoctorModel.findOne({ userId });
    if (existingDoctor) {
      throw new AppError("Doctor profile already exists for this user", 409);
    }

    const doctor = await DoctorModel.create({
      userId,
      clinicId,
      departmentId,
      specialization,
      qualification,
      experienceYears,
      consultationFee,
      bio,
      languages,
      isAvailable: isAvailable ?? false,
      profileStatus: "pending",
      isPublic: false,
    });

    const populatedDoctor = await DoctorModel.findById(doctor._id)
      .populate("userId", "name email phone avatar role")
      .populate("clinicId", "name city")
      .populate("departmentId", "name description");

    res.status(201).json({
      success: true,
      message: "Doctor created successfully",
      data: populatedDoctor ?? doctor,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateDoctor(req: Request, res: Response, next: NextFunction) {
  try {
    const doctorId = getDoctorIdParams(req);

    if (req.body?.userId) {
      await ensureDoctorUserExists(req.body.userId);
    }

    const doctor = await DoctorModel.findByIdAndUpdate(doctorId, req.body ?? {}, {
      new: true,
      runValidators: true,
    })
      .populate("userId", "name email phone avatar role")
      .populate("clinicId", "name city")
      .populate("departmentId", "name description");

    if (!doctor) {
      throw new AppError("Doctor not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Doctor updated successfully",
      data: doctor,
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
