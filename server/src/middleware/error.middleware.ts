import type { NextFunction, Request, Response } from "express";

import { AppError } from "../utils/appError.js";

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError("Route not found", 404));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const error = err instanceof AppError ? err : new AppError("Internal Server Error", 500);

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
  });
}
