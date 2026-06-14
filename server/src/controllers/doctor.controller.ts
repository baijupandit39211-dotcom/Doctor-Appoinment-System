import type { NextFunction, Request, Response } from "express";
import * as bcrypt from "bcryptjs";

import { DoctorModel } from "../models/Doctor.model.js";
import { UserModel } from "../models/User.model.js";
import { createDoctorAccount } from "../services/doctor.service.js";
import { queueNotificationForAdmins, queueNotificationForDoctorUser } from "../services/notification.service.js";
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

function toNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === "string" ? Number(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildProfileUpdatePayload(body: Record<string, unknown>) {
  const {
    avatar,
    name,
    email,
    phone,
    specialization,
    qualification,
    address,
    experienceYears,
    consultationFee,
    bio,
  } = body;

  const userChanges: Record<string, unknown> = {};
  const doctorChanges: Record<string, unknown> = {};

  if (avatar !== undefined) {
    userChanges.avatar = typeof avatar === "string" ? avatar.trim() || undefined : avatar;
  }

  if (name !== undefined) {
    userChanges.name = typeof name === "string" ? name.trim() : name;
  }

  if (email !== undefined) {
    userChanges.email = typeof email === "string" ? email.trim().toLowerCase() : email;
  }

  if (phone !== undefined) {
    userChanges.phone = typeof phone === "string" ? phone.trim() || undefined : phone;
  }

  if (specialization !== undefined) {
    doctorChanges.specialization = typeof specialization === "string" ? specialization.trim() || undefined : specialization;
  }

  if (qualification !== undefined) {
    doctorChanges.qualification = typeof qualification === "string" ? qualification.trim() || undefined : qualification;
  }

  if (address !== undefined) {
    doctorChanges.address = typeof address === "string" ? address.trim() || undefined : address;
  }

  if (experienceYears !== undefined) {
    doctorChanges.experienceYears = experienceYears;
  }

  if (consultationFee !== undefined) {
    doctorChanges.consultationFee = consultationFee;
  }

  if (bio !== undefined) {
    doctorChanges.bio = typeof bio === "string" ? bio.trim() || undefined : bio;
  }

  return {
    user: userChanges,
    doctor: doctorChanges,
  };
}

function hasProfileUpdateChanges(payload: { user: Record<string, unknown>; doctor: Record<string, unknown> }) {
  return Object.keys(payload.user).length > 0 || Object.keys(payload.doctor).length > 0;
}

function hasPendingProfileUpdate(doctor: { pendingProfileUpdate?: { status?: string } | null }) {
  return doctor.pendingProfileUpdate?.status === "pending";
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

    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    if (userId) {
      await ensureDoctorUserExists(userId);
      doctor.userId = userId;
    }

    const linkedUserId = typeof doctor.userId === "string" ? doctor.userId : doctor.userId?.toString?.() ?? "";
    if (req.user.role === "doctor" && linkedUserId && linkedUserId !== req.user._id.toString()) {
      throw new AppError("Forbidden", 403);
    }

    if (req.user.role === "doctor") {
      const pendingProfileUpdate = buildProfileUpdatePayload({
        avatar,
        name,
        email,
        phone: body.phone,
        specialization: doctorFields.specialization,
        qualification: doctorFields.qualification,
        address: doctorFields.address,
        experienceYears: doctorFields.experienceYears,
        consultationFee: doctorFields.consultationFee,
        bio: doctorFields.bio,
      });

      if (!hasProfileUpdateChanges(pendingProfileUpdate)) {
        throw new AppError("No profile changes were provided", 400);
      }

      doctor.pendingProfileUpdate = {
        status: "pending",
        requestedBy: req.user._id,
        requestedAt: new Date(),
        changes: pendingProfileUpdate,
      } as never;

      await doctor.save();

      const populatedDoctor = await DoctorModel.findById(doctorId)
        .populate("userId", "name email phone avatar role")
        .populate("clinicId", "name city")
        .populate("departmentId", "name description");

      const doctorUserId = linkedUserId || req.user._id.toString();
      await Promise.all([
        queueNotificationForDoctorUser(doctorUserId, {
          title: "Profile update submitted",
          message: "Your doctor profile update is waiting for admin review.",
          type: "system",
        }),
        queueNotificationForAdmins({
          title: "Doctor profile update pending review",
          message: "A doctor profile update is waiting for approval.",
          type: "system",
        }),
      ]);

      res.status(200).json({
        success: true,
        message: "Doctor profile update submitted for review",
        data: populatedDoctor ?? doctor,
      });
      return;
    }

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

async function applyPendingDoctorProfileUpdate(doctor: any) {
  const pendingProfileUpdate = (doctor as {
    pendingProfileUpdate?: {
      status?: string;
      changes?: {
        user?: Record<string, unknown>;
        doctor?: Record<string, unknown>;
      };
    } | null;
  }).pendingProfileUpdate;

  if (!pendingProfileUpdate || pendingProfileUpdate.status !== "pending") {
    return false;
  }

  const changes = pendingProfileUpdate.changes ?? {};
  const userChanges = changes.user ?? {};
  const doctorChanges = changes.doctor ?? {};

  const linkedUserId = typeof doctor.userId === "string" ? doctor.userId : doctor.userId?.toString?.() ?? "";
  if (linkedUserId) {
    const linkedUser = await UserModel.findById(linkedUserId).select("+password");
    if (!linkedUser) {
      throw new AppError("Linked user not found", 404);
    }

    if (typeof userChanges.name === "string" && userChanges.name.trim()) {
      linkedUser.name = userChanges.name.trim();
    }

    if (typeof userChanges.email === "string" && userChanges.email.trim()) {
      const normalizedEmail = userChanges.email.trim().toLowerCase();
      const existingUser = await UserModel.findOne({ email: normalizedEmail, _id: { $ne: linkedUser._id } }).lean();
      if (existingUser) {
        throw new AppError("Email already in use", 409);
      }
      linkedUser.email = normalizedEmail;
    }

    if ("phone" in userChanges) {
      linkedUser.phone = typeof userChanges.phone === "string" && userChanges.phone.trim() ? userChanges.phone.trim() : undefined;
    }

    if ("avatar" in userChanges) {
      linkedUser.avatar = typeof userChanges.avatar === "string" && userChanges.avatar.trim() ? userChanges.avatar.trim() : undefined;
    }

    await linkedUser.save();
  }

  if ("specialization" in doctorChanges) {
    doctor.specialization = typeof doctorChanges.specialization === "string" && doctorChanges.specialization.trim()
      ? doctorChanges.specialization.trim()
      : doctor.specialization;
  }
  if ("qualification" in doctorChanges) {
    doctor.qualification = typeof doctorChanges.qualification === "string" && doctorChanges.qualification.trim()
      ? doctorChanges.qualification.trim()
      : undefined;
  }
  if ("address" in doctorChanges) {
    doctor.address = typeof doctorChanges.address === "string" && doctorChanges.address.trim()
      ? doctorChanges.address.trim()
      : undefined;
  }
  if ("experienceYears" in doctorChanges) {
    doctor.experienceYears = toNumber(doctorChanges.experienceYears, doctor.experienceYears ?? 0);
  }
  if ("consultationFee" in doctorChanges) {
    doctor.consultationFee = toNumber(doctorChanges.consultationFee, doctor.consultationFee ?? 0);
  }
  if ("bio" in doctorChanges) {
    doctor.bio = typeof doctorChanges.bio === "string" && doctorChanges.bio.trim() ? doctorChanges.bio.trim() : undefined;
  }

  doctor.pendingProfileUpdate = null as never;
  await doctor.save();
  return true;
}

export async function approveDoctor(req: Request, res: Response, next: NextFunction) {
  try {
    const doctorId = getDoctorIdParams(req);

    const doctor = await DoctorModel.findById(doctorId);

    if (!doctor) {
      throw new AppError("Doctor not found", 404);
    }

    const wasPendingUpdate = await applyPendingDoctorProfileUpdate(doctor);

    if (!wasPendingUpdate) {
      doctor.profileStatus = "approved";
      doctor.isPublic = true;
      doctor.isAvailable = true;
      await doctor.save();
    }

    const populatedDoctor = await DoctorModel.findById(doctorId)
      .populate("userId", "name email phone avatar role")
      .populate("clinicId", "name city")
      .populate("departmentId", "name description");

    if (!populatedDoctor) {
      throw new AppError("Doctor not found", 404);
    }

    const doctorUserId = typeof populatedDoctor.userId === "object" && populatedDoctor.userId && "_id" in populatedDoctor.userId
      ? populatedDoctor.userId._id.toString()
      : "";

    if (doctorUserId) {
      await queueNotificationForDoctorUser(doctorUserId, {
        title: wasPendingUpdate ? "Doctor profile update approved" : "Doctor profile approved",
        message: wasPendingUpdate
          ? "Your doctor profile update has been approved and is now live."
          : "Your doctor profile has been approved and is now visible publicly.",
        type: "system",
      });
    }

    res.status(200).json({
      success: true,
      message: wasPendingUpdate ? "Doctor profile update approved successfully" : "Doctor approved successfully",
      data: populatedDoctor,
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

    const doctor = await DoctorModel.findById(doctorId);

    if (!doctor) {
      throw new AppError("Doctor not found", 404);
    }

    const pendingUpdate = (doctor as typeof doctor & { pendingProfileUpdate?: { status?: string } | null }).pendingProfileUpdate;
    const wasPendingUpdate = pendingUpdate?.status === "pending";

    if (wasPendingUpdate) {
      doctor.pendingProfileUpdate = null as never;
      await doctor.save();
    } else {
      doctor.profileStatus = "rejected";
      doctor.isPublic = false;
      doctor.isAvailable = false;
      await doctor.save();
    }

    const populatedDoctor = await DoctorModel.findById(doctorId)
      .populate("userId", "name email phone avatar role")
      .populate("clinicId", "name city")
      .populate("departmentId", "name description");

    if (!populatedDoctor) {
      throw new AppError("Doctor not found", 404);
    }

    const doctorUserId = typeof populatedDoctor.userId === "object" && populatedDoctor.userId && "_id" in populatedDoctor.userId
      ? populatedDoctor.userId._id.toString()
      : "";

    if (doctorUserId) {
      await queueNotificationForDoctorUser(doctorUserId, {
        title: wasPendingUpdate ? "Doctor profile update rejected" : "Doctor profile rejected",
        message: wasPendingUpdate
          ? "Your doctor profile update has been rejected and the live profile stayed unchanged."
          : "Your doctor profile has been rejected and is no longer public.",
        type: "system",
      });
    }

    res.status(200).json({
      success: true,
      message: wasPendingUpdate ? "Doctor profile update rejected successfully" : "Doctor rejected successfully",
      data: populatedDoctor,
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
