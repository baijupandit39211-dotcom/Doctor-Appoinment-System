import { Router } from "express";

import {
  createAvailability,
  deleteAvailability,
  listDoctorAvailability,
  updateAvailability,
} from "../controllers/availability.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

export const availabilityRouter = Router();

availabilityRouter.get("/doctor/:doctorId", listDoctorAvailability);
availabilityRouter.post("/", requireAuth, requireRole("doctor", "clinic_admin", "super_admin"), createAvailability);
availabilityRouter.patch("/:id", requireAuth, requireRole("doctor", "clinic_admin", "super_admin"), updateAvailability);
availabilityRouter.delete("/:id", requireAuth, requireRole("doctor", "clinic_admin", "super_admin"), deleteAvailability);
