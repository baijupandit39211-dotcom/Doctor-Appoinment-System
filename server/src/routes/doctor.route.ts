import { Router } from "express";

import {
  approveDoctor,
  createDoctor,
  deleteDoctor,
  getDoctorById,
  listDoctors,
  listAllDoctors,
  rejectDoctor,
  unpublishDoctor,
  updateDoctor,
} from "../controllers/doctor.controller.js";
import { optionalAuth, requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

export const doctorRouter = Router();

doctorRouter.get("/", optionalAuth, listDoctors);
doctorRouter.get("/admin/all", requireAuth, requireRole("clinic_admin", "super_admin"), listAllDoctors);
doctorRouter.patch("/:id/approve", requireAuth, requireRole("clinic_admin", "super_admin"), approveDoctor);
doctorRouter.patch("/:id/unpublish", requireAuth, requireRole("clinic_admin", "super_admin"), unpublishDoctor);
doctorRouter.patch("/:id/reject", requireAuth, requireRole("clinic_admin", "super_admin"), rejectDoctor);
doctorRouter.get("/:id", optionalAuth, getDoctorById);
doctorRouter.post("/", requireAuth, requireRole("clinic_admin", "super_admin"), createDoctor);
doctorRouter.patch("/:id", requireAuth, requireRole("doctor", "clinic_admin", "super_admin"), updateDoctor);
doctorRouter.delete("/:id", requireAuth, requireRole("clinic_admin", "super_admin"), deleteDoctor);
