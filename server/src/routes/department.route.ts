import { Router } from "express";

import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
} from "../controllers/department.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

export const departmentRouter = Router();

departmentRouter.get("/", listDepartments);
departmentRouter.post("/", requireAuth, requireRole("clinic_admin", "super_admin"), createDepartment);
departmentRouter.patch("/:id", requireAuth, requireRole("clinic_admin", "super_admin"), updateDepartment);
departmentRouter.delete("/:id", requireAuth, requireRole("clinic_admin", "super_admin"), deleteDepartment);
