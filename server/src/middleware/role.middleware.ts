import type { NextFunction, Request, Response } from "express";

import { AppError } from "../utils/appError.js";
import type { UserRole } from "../models/types.js";

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new AppError("Unauthorized", 401));
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      next(new AppError("Forbidden", 403));
      return;
    }

    next();
  };
}
