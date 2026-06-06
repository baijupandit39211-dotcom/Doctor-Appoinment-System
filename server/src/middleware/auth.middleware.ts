import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { AppError } from "../utils/appError.js";
import { UserModel } from "../models/User.model.js";

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[env.COOKIE_NAME];

    if (!token) {
      throw new AppError("Unauthorized", 401);
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    const userId = typeof payload.sub === "string" ? payload.sub : undefined;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const user = await UserModel.findById(userId);
    if (!user || !user.isActive) {
      throw new AppError("Unauthorized", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError("Unauthorized", 401));
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[env.COOKIE_NAME];

    if (!token) {
      next();
      return;
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    const userId = typeof payload.sub === "string" ? payload.sub : undefined;

    if (!userId) {
      next();
      return;
    }

    const user = await UserModel.findById(userId);
    if (user && user.isActive) {
      req.user = user;
    }

    next();
  } catch {
    next();
  }
}
