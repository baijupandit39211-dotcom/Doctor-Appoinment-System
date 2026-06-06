import { Router } from "express";

import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import type { UserRole } from "../models/types.js";

export const protectedTestRouter = Router();

function protectedResponse(requiredScope: string) {
  return (req: Parameters<typeof requireAuth>[0], res: Parameters<typeof requireAuth>[1]) => {
    res.status(200).json({
      success: true,
      message: `${requiredScope} access granted`,
      data: {
        user: req.user
          ? {
              id: req.user._id.toString(),
              name: req.user.name,
              email: req.user.email,
              role: req.user.role,
            }
          : null,
      },
    });
  };
}

protectedTestRouter.get("/me", requireAuth, protectedResponse("Authenticated"));
protectedTestRouter.get(
  "/patient",
  requireAuth,
  requireRole("patient" satisfies UserRole),
  protectedResponse("Patient"),
);
protectedTestRouter.get(
  "/doctor",
  requireAuth,
  requireRole("doctor" satisfies UserRole),
  protectedResponse("Doctor"),
);
protectedTestRouter.get(
  "/admin",
  requireAuth,
  requireRole("clinic_admin" satisfies UserRole),
  protectedResponse("Clinic admin"),
);
protectedTestRouter.get(
  "/superadmin",
  requireAuth,
  requireRole("super_admin" satisfies UserRole),
  protectedResponse("Super admin"),
);
