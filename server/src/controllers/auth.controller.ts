import type { NextFunction, Request, Response } from "express";

import {
  createPasswordResetToken,
  clearAuthCookie,
  getCurrentUser,
  loginUser,
  registerUser,
  setAuthCookie,
  resetPassword,
} from "../services/auth.service.js";
import { AppError } from "../utils/appError.js";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password, role } = req.body ?? {};

    if (!name || !email || !password) {
      throw new AppError("Name, email, and password are required", 400);
    }

    const result = await registerUser({ name, email, password, role });

    setAuthCookie(res, result.token);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result.user,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      throw new AppError("Email and password are required", 400);
    }

    const result = await loginUser({ email, password });

    setAuthCookie(res, result.token);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result.user,
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(_req: Request, res: Response, next: NextFunction) {
  try {
    clearAuthCookie(res);

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const user = await getCurrentUser(req.user._id.toString());

    res.status(200).json({
      success: true,
      message: "Current user loaded",
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body ?? {};

    if (!email) {
      throw new AppError("Email is required", 400);
    }

    await createPasswordResetToken(email);

    res.status(200).json({
      success: true,
      message: "If an account exists for that email, a reset link has been prepared.",
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPasswordHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body ?? {};

    if (!token || !password) {
      throw new AppError("Token and password are required", 400);
    }

    const result = await resetPassword({ token, password });

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}
