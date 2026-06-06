import type { NextFunction, Request, Response } from "express";

import { AppointmentModel } from "../models/Appointment.model.js";
import { DoctorModel } from "../models/Doctor.model.js";
import { PatientModel } from "../models/Patient.model.js";
import { appointmentStatuses, type AppointmentStatus } from "../models/types.js";
import { getOrCreateDoctorProfile } from "../services/doctor.service.js";
import { getOrCreatePatientProfile } from "../services/patient.service.js";
import {
  queueNotificationForAdmins,
  queueNotificationForDoctorUser,
  queueNotificationForPatientUser,
} from "../services/notification.service.js";
import { AppError } from "../utils/appError.js";

const allowedCancelRoles = ["patient", "doctor", "clinic_admin", "super_admin"] as const;

function getAppointmentId(req: Request) {
  const appointmentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!appointmentId) {
    throw new AppError("Appointment id is required", 400);
  }
  return appointmentId;
}

function validateAppointmentStatus(status: unknown) {
  if (typeof status !== "string" || !appointmentStatuses.includes(status as AppointmentStatus)) {
    throw new AppError("Invalid appointment status", 400);
  }

  return status as AppointmentStatus;
}

async function getPatientProfileId(userId: string) {
  const patient = await getOrCreatePatientProfile(userId);
  return patient._id.toString();
}

async function getDoctorProfile(userId: string) {
  return getOrCreateDoctorProfile(userId);
}

function resolveUserId(user: unknown) {
  if (!user) {
    return "";
  }

  if (typeof user === "string") {
    return user;
  }

  if (typeof user === "object" && "_id" in user && user._id) {
    return user._id.toString();
  }

  return "";
}

function getUserName(user: unknown, fallback: string) {
  if (typeof user === "object" && user && "name" in user) {
    const name = (user as { name?: string }).name;
    if (typeof name === "string" && name.trim()) {
      return name;
    }
  }

  return fallback;
}

function formatAppointmentDateForNotification(value?: unknown) {
  if (!value) {
    return "unspecified date";
  }

  const date = value instanceof Date ? value : new Date(value.toString());
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : value.toString();
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

async function getAppointmentParticipants(appointment: {
  patientId?: unknown;
  doctorId?: unknown;
}) {
  const [patient, doctor] = await Promise.all([
    appointment.patientId ? PatientModel.findById(appointment.patientId).populate("userId", "name email") : null,
    appointment.doctorId ? DoctorModel.findById(appointment.doctorId).populate("userId", "name email") : null,
  ]);

  return {
    patientUserId: resolveUserId(patient?.userId),
    patientName: getUserName(patient?.userId, "Patient"),
    doctorUserId: resolveUserId(doctor?.userId),
    doctorName: getUserName(doctor?.userId, "Doctor"),
  };
}

async function notifyAppointmentCreated(params: {
  appointment: {
    patientId?: unknown;
    doctorId?: unknown;
    appointmentDate?: unknown;
    startTime?: string;
    reason?: string;
  };
  actorRole: string;
  actorUserId: string;
}) {
  const participants = await getAppointmentParticipants(params.appointment);
  const appointmentDate = formatAppointmentDateForNotification(params.appointment.appointmentDate);
  const appointmentTime = params.appointment.startTime ?? "--:--";
  const appointmentReason = params.appointment.reason?.trim() ? params.appointment.reason.trim() : "No reason provided";

  const notifications = [];

  if (params.actorRole === "patient") {
    if (participants.doctorUserId) {
      notifications.push(
        queueNotificationForDoctorUser(participants.doctorUserId, {
          title: "New appointment booked",
          message: `${participants.patientName} booked an appointment for ${appointmentDate} at ${appointmentTime}. ${appointmentReason}`,
          type: "appointment",
        }),
      );
    }

    notifications.push(
      queueNotificationForAdmins({
        title: "New appointment activity",
        message: `A patient booked an appointment for ${appointmentDate} at ${appointmentTime}.`,
        type: "appointment",
      }, params.actorUserId ? { excludeUserIds: [params.actorUserId] } : undefined),
    );
  } else {
    if (participants.patientUserId) {
      notifications.push(
        queueNotificationForPatientUser(participants.patientUserId, {
          title: "Appointment scheduled",
          message: `An appointment has been scheduled with Dr. ${participants.doctorName} for ${appointmentDate} at ${appointmentTime}.`,
          type: "appointment",
        }),
      );
    }

    if (participants.doctorUserId) {
      notifications.push(
        queueNotificationForDoctorUser(participants.doctorUserId, {
          title: "New appointment booked",
          message: `${participants.patientName} has a new appointment for ${appointmentDate} at ${appointmentTime}.`,
          type: "appointment",
        }),
      );
    }

    notifications.push(
      queueNotificationForAdmins({
        title: "New appointment activity",
        message: `A clinic appointment was created for ${appointmentDate} at ${appointmentTime}.`,
        type: "appointment",
      }, params.actorUserId ? { excludeUserIds: [params.actorUserId] } : undefined),
    );
  }

  await Promise.allSettled(notifications);
}

async function notifyAppointmentStatusChange(params: {
  appointment: {
    patientId?: unknown;
    doctorId?: unknown;
    appointmentDate?: unknown;
    startTime?: string;
  };
  status: AppointmentStatus;
  actorRole: string;
  actorUserId: string;
}) {
  const participants = await getAppointmentParticipants(params.appointment);
  const appointmentDate = formatAppointmentDateForNotification(params.appointment.appointmentDate);
  const appointmentTime = params.appointment.startTime ?? "--:--";
  const statusLabel = params.status.replace("_", " ");

  const notifications = [];

  if (participants.patientUserId && params.actorRole !== "patient") {
    notifications.push(
      queueNotificationForPatientUser(participants.patientUserId, {
        title: `Appointment ${statusLabel}`,
        message: `Your appointment with Dr. ${participants.doctorName} on ${appointmentDate} at ${appointmentTime} was marked as ${statusLabel}.`,
        type: "appointment",
      }),
    );
  }

  if (participants.doctorUserId && params.actorRole !== "doctor") {
    notifications.push(
      queueNotificationForDoctorUser(participants.doctorUserId, {
        title: `Appointment ${statusLabel}`,
        message: `${participants.patientName}'s appointment on ${appointmentDate} at ${appointmentTime} was marked as ${statusLabel}.`,
        type: "appointment",
      }),
    );
  }

  notifications.push(
    queueNotificationForAdmins({
      title: `Appointment ${statusLabel}`,
      message: `An appointment was marked as ${statusLabel} on ${appointmentDate} at ${appointmentTime}.`,
      type: "appointment",
    }, params.actorUserId ? { excludeUserIds: [params.actorUserId] } : undefined),
  );

  await Promise.allSettled(notifications);
}

async function notifyAppointmentCancelled(params: {
  appointment: {
    patientId?: unknown;
    doctorId?: unknown;
    appointmentDate?: unknown;
    startTime?: string;
  };
  actorRole: string;
  actorUserId: string;
}) {
  const participants = await getAppointmentParticipants(params.appointment);
  const appointmentDate = formatAppointmentDateForNotification(params.appointment.appointmentDate);
  const appointmentTime = params.appointment.startTime ?? "--:--";

  const notifications = [];

  if (participants.patientUserId && params.actorRole !== "patient") {
    notifications.push(
      queueNotificationForPatientUser(participants.patientUserId, {
        title: "Appointment cancelled",
        message: `Your appointment with Dr. ${participants.doctorName} on ${appointmentDate} at ${appointmentTime} was cancelled.`,
        type: "appointment",
      }),
    );
  }

  if (participants.doctorUserId && params.actorRole !== "doctor") {
    notifications.push(
      queueNotificationForDoctorUser(participants.doctorUserId, {
        title: "Appointment cancelled",
        message: `${participants.patientName}'s appointment on ${appointmentDate} at ${appointmentTime} was cancelled.`,
        type: "appointment",
      }),
    );
  }

  notifications.push(
    queueNotificationForAdmins({
      title: "Appointment cancelled",
      message: `An appointment was cancelled on ${appointmentDate} at ${appointmentTime}.`,
      type: "appointment",
    }, params.actorUserId ? { excludeUserIds: [params.actorUserId] } : undefined),
  );

  await Promise.allSettled(notifications);
}

async function getAppointmentOrThrow(appointmentId: string) {
  const appointment = await AppointmentModel.findById(appointmentId)
    .populate("patientId", "userId dateOfBirth gender address emergencyContact")
    .populate("doctorId", "userId clinicId departmentId specialization qualification experienceYears consultationFee bio languages isAvailable")
    .populate("clinicId", "name city");

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  return appointment;
}

function isAdminRole(role: string) {
  return role === "clinic_admin" || role === "super_admin";
}

export async function createAppointment(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const { patientId, doctorId, appointmentDate, startTime, endTime, reason, notes, status, clinicId } = req.body ?? {};

    if (!doctorId || !appointmentDate || !startTime) {
      throw new AppError("doctorId, appointmentDate, and startTime are required", 400);
    }

    const appointmentStatus = status ? validateAppointmentStatus(status) : "pending";

    let resolvedPatientId: string;
    if (req.user.role === "patient") {
      const ownPatient = await getOrCreatePatientProfile(req.user._id.toString());
      resolvedPatientId = ownPatient._id.toString();

      if (patientId && patientId !== resolvedPatientId && patientId !== req.user._id.toString()) {
        throw new AppError("Patients can only create appointments for themselves", 403);
      }
    } else {
      if (!patientId) {
        throw new AppError("patientId is required", 400);
      }

      const requestedPatient = await PatientModel.findById(patientId);
      if (!requestedPatient) {
        throw new AppError("Patient not found", 404);
      }

      resolvedPatientId = requestedPatient._id.toString();
    }

    if (req.user.role === "doctor") {
      throw new AppError("Doctors cannot create appointments", 403);
    }

    const doctor = await DoctorModel.findById(doctorId);
    if (!doctor) {
      throw new AppError("Doctor not found", 404);
    }

    const existingBooking = await AppointmentModel.findOne({ doctorId, appointmentDate, startTime });
    if (existingBooking) {
      throw new AppError("This appointment slot is already booked", 409);
    }

    const appointment = await AppointmentModel.create({
      patientId: resolvedPatientId,
      doctorId,
      clinicId: clinicId ?? doctor.clinicId,
      appointmentDate,
      startTime,
      endTime,
      reason,
      notes,
      status: appointmentStatus,
    });

    const populatedAppointment = await AppointmentModel.findById(appointment._id)
      .populate("patientId", "userId dateOfBirth gender address emergencyContact")
      .populate("doctorId", "userId clinicId departmentId specialization qualification experienceYears consultationFee bio languages isAvailable")
      .populate("clinicId", "name city");

    await notifyAppointmentCreated({
      appointment: {
        patientId: populatedAppointment?.patientId ?? appointment.patientId,
        doctorId: populatedAppointment?.doctorId ?? appointment.doctorId,
        appointmentDate,
        startTime,
        reason,
      },
      actorRole: req.user.role,
      actorUserId: req.user._id.toString(),
    });

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: populatedAppointment ?? appointment,
    });
  } catch (error) {
    next(error);
  }
}

export async function listMyAppointments(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    let appointments;

    if (isAdminRole(req.user.role)) {
      appointments = await AppointmentModel.find()
        .sort({ createdAt: -1 })
        .populate("patientId", "userId dateOfBirth gender address emergencyContact")
        .populate("doctorId", "userId clinicId departmentId specialization qualification experienceYears consultationFee bio languages isAvailable")
        .populate("clinicId", "name city");
    } else if (req.user.role === "doctor") {
      const doctor = await getDoctorProfile(req.user._id.toString());
      appointments = await AppointmentModel.find({ doctorId: doctor._id })
        .sort({ appointmentDate: -1, startTime: -1 })
        .populate("patientId", "userId dateOfBirth gender address emergencyContact")
        .populate("doctorId", "userId clinicId departmentId specialization qualification experienceYears consultationFee bio languages isAvailable")
        .populate("clinicId", "name city");
    } else {
      const patientId = await getPatientProfileId(req.user._id.toString());
      appointments = await AppointmentModel.find({ patientId })
        .sort({ appointmentDate: -1, startTime: -1 })
        .populate("patientId", "userId dateOfBirth gender address emergencyContact")
        .populate("doctorId", "userId clinicId departmentId specialization qualification experienceYears consultationFee bio languages isAvailable")
        .populate("clinicId", "name city");
    }

    res.status(200).json({
      success: true,
      message: "Appointments fetched successfully",
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAppointmentById(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const appointmentId = getAppointmentId(req);
    const appointment = await getAppointmentOrThrow(appointmentId);

    if (isAdminRole(req.user.role)) {
      res.status(200).json({
        success: true,
        message: "Appointment fetched successfully",
        data: appointment,
      });
      return;
    }

    if (req.user.role === "doctor") {
      const doctor = await getDoctorProfile(req.user._id.toString());
      if (appointment.doctorId && appointment.doctorId.toString() !== doctor._id.toString()) {
        throw new AppError("Forbidden", 403);
      }
    } else {
      const patientId = await getPatientProfileId(req.user._id.toString());
      if (appointment.patientId && appointment.patientId.toString() !== patientId) {
        throw new AppError("Forbidden", 403);
      }
    }

    res.status(200).json({
      success: true,
      message: "Appointment fetched successfully",
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAppointmentStatus(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const appointmentId = getAppointmentId(req);
    const { status } = req.body ?? {};
    const appointmentStatus = validateAppointmentStatus(status);

    const appointment = await getAppointmentOrThrow(appointmentId);

    if (req.user.role === "doctor") {
      const doctor = await getDoctorProfile(req.user._id.toString());
      if (appointment.doctorId && appointment.doctorId.toString() !== doctor._id.toString()) {
        throw new AppError("Forbidden", 403);
      }
    } else if (!isAdminRole(req.user.role)) {
      throw new AppError("Forbidden", 403);
    }

    const updatedAppointment = await AppointmentModel.findByIdAndUpdate(
      appointmentId,
      { status: appointmentStatus },
      { new: true, runValidators: true },
    )
      .populate("patientId", "userId dateOfBirth gender address emergencyContact")
      .populate("doctorId", "userId clinicId departmentId specialization qualification experienceYears consultationFee bio languages isAvailable")
      .populate("clinicId", "name city");

    if (!updatedAppointment) {
      throw new AppError("Appointment not found", 404);
    }

    await notifyAppointmentStatusChange({
      appointment: {
        patientId: updatedAppointment.patientId,
        doctorId: updatedAppointment.doctorId,
        appointmentDate: updatedAppointment.appointmentDate,
        startTime: updatedAppointment.startTime,
      },
      status: appointmentStatus,
      actorRole: req.user.role,
      actorUserId: req.user._id.toString(),
    });

    res.status(200).json({
      success: true,
      message: "Appointment status updated successfully",
      data: updatedAppointment,
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelAppointment(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const appointmentId = getAppointmentId(req);
    const { cancellationReason } = req.body ?? {};
    const appointment = await getAppointmentOrThrow(appointmentId);

    let cancelledBy: (typeof allowedCancelRoles)[number] | null = null;

    if (req.user.role === "patient") {
      const patientId = await getPatientProfileId(req.user._id.toString());
      if (appointment.patientId && appointment.patientId.toString() !== patientId) {
        throw new AppError("Patients can only cancel their own appointments", 403);
      }
      cancelledBy = "patient";
    } else if (req.user.role === "doctor") {
      const doctor = await getDoctorProfile(req.user._id.toString());
      if (appointment.doctorId && appointment.doctorId.toString() !== doctor._id.toString()) {
        throw new AppError("Doctors can only cancel their own appointments", 403);
      }
      cancelledBy = "doctor";
    } else if (isAdminRole(req.user.role)) {
      cancelledBy = "clinic_admin";
    } else {
      throw new AppError("Forbidden", 403);
    }

    const updatedAppointment = await AppointmentModel.findByIdAndUpdate(
      appointmentId,
      {
        status: "cancelled",
        cancelledBy,
        cancellationReason,
      },
      { new: true, runValidators: true },
    )
      .populate("patientId", "userId dateOfBirth gender address emergencyContact")
      .populate("doctorId", "userId clinicId departmentId specialization qualification experienceYears consultationFee bio languages isAvailable")
      .populate("clinicId", "name city");

    if (!updatedAppointment) {
      throw new AppError("Appointment not found", 404);
    }

    await notifyAppointmentCancelled({
      appointment: {
        patientId: updatedAppointment.patientId,
        doctorId: updatedAppointment.doctorId,
        appointmentDate: updatedAppointment.appointmentDate,
        startTime: updatedAppointment.startTime,
      },
      actorRole: req.user.role,
      actorUserId: req.user._id.toString(),
    });

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      data: updatedAppointment,
    });
  } catch (error) {
    next(error);
  }
}
