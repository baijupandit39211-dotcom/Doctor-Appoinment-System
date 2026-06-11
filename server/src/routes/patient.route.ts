import { Router } from "express";

import { me, updateMe } from "../controllers/patient.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

export const patientRouter = Router();

patientRouter.get("/me", requireAuth, requireRole("patient"), me);
patientRouter.patch("/me", requireAuth, requireRole("patient"), updateMe);
