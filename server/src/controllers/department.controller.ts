import type { NextFunction, Request, Response } from "express";

import { DepartmentModel } from "../models/Department.model.js";
import { AppError } from "../utils/appError.js";

function getDepartmentIdParams(req: Request) {
  const departmentId = req.params.id;
  if (!departmentId) {
    throw new AppError("Department id is required", 400);
  }
  return departmentId;
}

export async function listDepartments(_req: Request, res: Response, next: NextFunction) {
  try {
    const departments = await DepartmentModel.find()
      .sort({ createdAt: -1 })
      .populate("clinicId", "name city");

    res.status(200).json({
      success: true,
      message: "Departments fetched successfully",
      data: departments,
    });
  } catch (error) {
    next(error);
  }
}

export async function createDepartment(req: Request, res: Response, next: NextFunction) {
  try {
    const { clinicId, name, description, isActive } = req.body ?? {};

    if (!clinicId || !name) {
      throw new AppError("clinicId and name are required", 400);
    }

    const department = await DepartmentModel.create({
      clinicId,
      name,
      description,
      isActive,
    });

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: department,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateDepartment(req: Request, res: Response, next: NextFunction) {
  try {
    const departmentId = getDepartmentIdParams(req);

    const department = await DepartmentModel.findByIdAndUpdate(departmentId, req.body ?? {}, {
      new: true,
      runValidators: true,
    });

    if (!department) {
      throw new AppError("Department not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Department updated successfully",
      data: department,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteDepartment(req: Request, res: Response, next: NextFunction) {
  try {
    const departmentId = getDepartmentIdParams(req);

    const department = await DepartmentModel.findByIdAndDelete(departmentId);
    if (!department) {
      throw new AppError("Department not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}
