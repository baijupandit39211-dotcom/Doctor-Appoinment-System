import { Router } from "express";

import { adminOverview, appointmentsReport, doctorOverview } from "../controllers/report.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

export const reportRouter = Router();

reportRouter.get("/admin-overview", requireAuth, requireRole("clinic_admin", "super_admin"), adminOverview);
reportRouter.get("/doctor-overview", requireAuth, requireRole("doctor", "clinic_admin", "super_admin"), doctorOverview);
reportRouter.get("/appointments", requireAuth, requireRole("clinic_admin", "super_admin"), appointmentsReport);
