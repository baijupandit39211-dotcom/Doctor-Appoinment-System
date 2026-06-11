import type { NextFunction, Request, Response } from "express";

import { getOrCreatePatientProfile, updatePatientProfile } from "../services/patient.service.js";
import { AppError } from "../utils/appError.js";

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    if (req.user.role !== "patient") {
      throw new AppError("Forbidden", 403);
    }

    const patient = await getOrCreatePatientProfile(req.user._id.toString());

    res.status(200).json({
      success: true,
      message: "Patient profile loaded successfully",
      data: patient,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    if (req.user.role !== "patient") {
      throw new AppError("Forbidden", 403);
    }

    const { name, phone, avatar, dateOfBirth, gender, address } = req.body ?? {};

    const patient = await updatePatientProfile(req.user._id.toString(), {
      name,
      phone,
      avatar,
      dateOfBirth,
      gender,
      address,
    });

    res.status(200).json({
      success: true,
      message: "Patient profile updated successfully",
      data: patient,
    });
  } catch (error) {
    next(error);
  }
}
