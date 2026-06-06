import type { NextFunction, Request, Response } from "express";

import { AvailabilityModel } from "../models/Availability.model.js";
import { DoctorModel } from "../models/Doctor.model.js";
import { getOrCreateDoctorProfile } from "../services/doctor.service.js";
import { AppError } from "../utils/appError.js";

const allowedDayValues = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

function validateDayOfWeek(dayOfWeek: unknown) {
  if (typeof dayOfWeek !== "string" || !allowedDayValues.includes(dayOfWeek as (typeof allowedDayValues)[number])) {
    throw new AppError("dayOfWeek must be a valid weekday", 400);
  }

  return dayOfWeek as (typeof allowedDayValues)[number];
}

function getAvailabilityId(req: Request) {
  const availabilityId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!availabilityId) {
    throw new AppError("Availability id is required", 400);
  }
  return availabilityId;
}

function getDoctorIdParam(req: Request) {
  const doctorId = Array.isArray(req.params.doctorId) ? req.params.doctorId[0] : req.params.doctorId;
  if (!doctorId) {
    throw new AppError("doctorId is required", 400);
  }
  return doctorId;
}

async function getDoctorProfileIdForCurrentUser(userId: string) {
  const doctorProfile = await getOrCreateDoctorProfile(userId);
  return doctorProfile._id;
}

async function assertDoctorOwnership(
  req: Request,
  doctorId: string,
) {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }

  if (req.user.role === "doctor") {
    const myDoctorProfileId = await getDoctorProfileIdForCurrentUser(req.user._id.toString());
    if (myDoctorProfileId.toString() !== doctorId) {
      throw new AppError("You can only manage your own availability", 403);
    }
  }
}

async function hydrateAvailabilityRecord(availabilityId: string) {
  const availability = await AvailabilityModel.findById(availabilityId).populate("doctorId", "userId clinicId departmentId specialization");
  if (!availability) {
    throw new AppError("Availability not found", 404);
  }
  return availability;
}

function resolveDoctorId(doctorRef: unknown) {
  if (typeof doctorRef === "string") {
    return doctorRef;
  }

  if (doctorRef && typeof doctorRef === "object" && "_id" in doctorRef) {
    const populatedDoctor = doctorRef as { _id: { toString(): string } };
    return populatedDoctor._id.toString();
  }

  throw new AppError("Doctor reference is invalid", 400);
}

export async function createAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const { doctorId, dayOfWeek, startTime, endTime, slotDurationMinutes, clinicId, isActive } = req.body ?? {};
    if (!doctorId || !dayOfWeek || !startTime || !endTime) {
      throw new AppError("doctorId, dayOfWeek, startTime, and endTime are required", 400);
    }

    const resolvedDayOfWeek = validateDayOfWeek(dayOfWeek);
    await assertDoctorOwnership(req, doctorId);

    const doctor = await DoctorModel.findById(doctorId);
    if (!doctor) {
      throw new AppError("Doctor not found", 404);
    }

    const availability = await AvailabilityModel.create({
      doctorId,
      clinicId: clinicId ?? doctor.clinicId,
      dayOfWeek: resolvedDayOfWeek,
      startTime,
      endTime,
      slotDurationMinutes,
      isActive,
    });

    res.status(201).json({
      success: true,
      message: "Availability created successfully",
      data: availability,
    });
  } catch (error) {
    next(error);
  }
}

export async function listDoctorAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    const doctorId = getDoctorIdParam(req);
    const availability = await AvailabilityModel.find({ doctorId, isActive: true }).sort({ dayOfWeek: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      message: "Doctor availability fetched successfully",
      data: availability,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const availabilityId = getAvailabilityId(req);
    const availability = await hydrateAvailabilityRecord(availabilityId);

    await assertDoctorOwnership(req, resolveDoctorId(availability.doctorId));

    const updates = { ...req.body };
    if (updates.dayOfWeek !== undefined) {
      updates.dayOfWeek = validateDayOfWeek(updates.dayOfWeek);
    }

    if (updates.doctorId !== undefined) {
      const updatedDoctorId = resolveDoctorId(updates.doctorId);
      await assertDoctorOwnership(req, updatedDoctorId);
      const doctor = await DoctorModel.findById(updatedDoctorId);
      if (!doctor) {
        throw new AppError("Doctor not found", 404);
      }
    }

    const updatedAvailability = await AvailabilityModel.findByIdAndUpdate(availabilityId, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedAvailability) {
      throw new AppError("Availability not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Availability updated successfully",
      data: updatedAvailability,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const availabilityId = getAvailabilityId(req);
    const availability = await hydrateAvailabilityRecord(availabilityId);

    await assertDoctorOwnership(req, resolveDoctorId(availability.doctorId));

    await AvailabilityModel.findByIdAndDelete(availabilityId);

    res.status(200).json({
      success: true,
      message: "Availability deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}
