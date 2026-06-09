import type { NextFunction, Request, Response } from "express";

import { AppointmentModel } from "../models/Appointment.model.js";
import { DepartmentModel } from "../models/Department.model.js";
import { DoctorModel } from "../models/Doctor.model.js";
import { PatientModel } from "../models/Patient.model.js";
import { UserModel } from "../models/User.model.js";
import { getOrCreateDoctorProfile } from "../services/doctor.service.js";
import { AppError } from "../utils/appError.js";

const statusValues = ["pending", "confirmed", "completed", "cancelled", "no_show"] as const;

function parseOptionalString(value: unknown) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return typeof value === "string" ? value : undefined;
}

function buildAppointmentFilters(query: Request["query"]) {
  const filters: Record<string, unknown> = {};

  const status = parseOptionalString(query.status);
  if (status) {
    if (!statusValues.includes(status as (typeof statusValues)[number])) {
      throw new AppError("Invalid status filter", 400);
    }
    filters.status = status;
  }

  const doctorId = parseOptionalString(query.doctorId);
  if (doctorId) {
    filters.doctorId = doctorId;
  }

  const patientId = parseOptionalString(query.patientId);
  if (patientId) {
    filters.patientId = patientId;
  }

  const fromDate = parseOptionalString(query.fromDate);
  if (fromDate) {
    const parsedFromDate = new Date(fromDate);
    if (Number.isNaN(parsedFromDate.getTime())) {
      throw new AppError("Invalid fromDate filter", 400);
    }
    filters.appointmentDate = { ...(filters.appointmentDate as object), $gte: parsedFromDate };
  }

  const toDate = parseOptionalString(query.toDate);
  if (toDate) {
    const parsedToDate = new Date(toDate);
    if (Number.isNaN(parsedToDate.getTime())) {
      throw new AppError("Invalid toDate filter", 400);
    }
    filters.appointmentDate = { ...(filters.appointmentDate as object), $lte: parsedToDate };
  }

  return filters;
}

async function getDoctorProfileByUserId(userId: string) {
  return getOrCreateDoctorProfile(userId);
}

async function getPatientProfileByUserId(userId: string) {
  const patient = await PatientModel.findOne({ userId });
  if (!patient) {
    throw new AppError("Patient profile not found", 404);
  }
  return patient;
}

async function buildCounts(baseFilters: Record<string, unknown>) {
  const [
    totalDoctors,
    totalPatients,
    totalDepartments,
    totalAppointments,
    pendingAppointments,
    confirmedAppointments,
    completedAppointments,
    cancelledAppointments,
    noShowAppointments,
  ] = await Promise.all([
    DoctorModel.countDocuments(baseFilters),
    PatientModel.countDocuments(baseFilters),
    DepartmentModel.countDocuments(baseFilters),
    AppointmentModel.countDocuments(baseFilters),
    AppointmentModel.countDocuments({ ...baseFilters, status: "pending" }),
    AppointmentModel.countDocuments({ ...baseFilters, status: "confirmed" }),
    AppointmentModel.countDocuments({ ...baseFilters, status: "completed" }),
    AppointmentModel.countDocuments({ ...baseFilters, status: "cancelled" }),
    AppointmentModel.countDocuments({ ...baseFilters, status: "no_show" }),
  ]);

  return {
    totalDoctors,
    totalPatients,
    totalDepartments,
    totalAppointments,
    pendingAppointments,
    confirmedAppointments,
    completedAppointments,
    cancelledAppointments,
    noShowAppointments,
  };
}

export async function adminOverview(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    if (!(req.user.role === "clinic_admin" || req.user.role === "super_admin")) {
      throw new AppError("Forbidden", 403);
    }

    const counts = await buildCounts({});

    res.status(200).json({
      success: true,
      message: "Admin overview fetched successfully",
      data: counts,
    });
  } catch (error) {
    next(error);
  }
}

export async function doctorOverview(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    if (!(req.user.role === "doctor" || req.user.role === "clinic_admin" || req.user.role === "super_admin")) {
      throw new AppError("Forbidden", 403);
    }

    let doctorId = parseOptionalString(req.query.doctorId);
    let profileStatus: string | undefined;
    let isPublic: boolean | undefined;
    let isAvailable: boolean | undefined;

    if (req.user.role === "doctor") {
      const doctor = await getDoctorProfileByUserId(req.user._id.toString());
      doctorId = doctor._id.toString();
      profileStatus = doctor.profileStatus;
      isPublic = doctor.isPublic;
      isAvailable = doctor.isAvailable;
    }

    const baseFilters = doctorId ? { doctorId } : {};
    const counts = await buildCounts(baseFilters);

    res.status(200).json({
      success: true,
      message: "Doctor overview fetched successfully",
      data: {
        doctorId: doctorId ?? null,
        profileStatus: profileStatus ?? null,
        isPublic: isPublic ?? null,
        isAvailable: isAvailable ?? null,
        ...counts,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function appointmentsReport(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    if (!(req.user.role === "clinic_admin" || req.user.role === "super_admin")) {
      throw new AppError("Forbidden", 403);
    }

    const filters = buildAppointmentFilters(req.query);
    const appointments = await AppointmentModel.find(filters)
      .sort({ appointmentDate: -1, startTime: -1 })
      .populate("patientId", "userId dateOfBirth gender address emergencyContact")
      .populate("doctorId", "userId clinicId departmentId specialization qualification experienceYears consultationFee bio languages isAvailable")
      .populate("clinicId", "name city");

    const counts = await buildCounts(filters);

    res.status(200).json({
      success: true,
      message: "Appointments report fetched successfully",
      data: {
        ...counts,
        filters,
        appointments,
      },
    });
  } catch (error) {
    next(error);
  }
}
