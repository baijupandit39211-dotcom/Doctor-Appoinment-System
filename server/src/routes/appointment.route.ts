import { Router } from "express";

import {
  cancelAppointment,
  createAppointment,
  getAppointmentById,
  listMyAppointments,
  updateAppointmentStatus,
} from "../controllers/appointment.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

export const appointmentRouter = Router();

appointmentRouter.post("/", requireAuth, createAppointment);
appointmentRouter.get("/me", requireAuth, listMyAppointments);
appointmentRouter.get("/:id", requireAuth, getAppointmentById);
appointmentRouter.patch("/:id/status", requireAuth, requireRole("doctor", "clinic_admin", "super_admin"), updateAppointmentStatus);
appointmentRouter.patch("/:id/cancel", requireAuth, cancelAppointment);
