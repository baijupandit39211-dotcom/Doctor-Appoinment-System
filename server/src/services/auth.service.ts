import * as bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { getOrCreatePatientProfile } from "./patient.service.js";
import { AppError } from "../utils/appError.js";
import { UserModel, type UserDocument } from "../models/User.model.js";
import { type UserRole } from "../models/types.js";

type PublicUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type UserLike = Pick<
  UserDocument,
  "_id" | "name" | "email" | "phone" | "role" | "avatar" | "isActive" | "createdAt" | "updatedAt"
> & {
  password?: string;
  toObject(): Omit<PublicUser, "id"> & { password?: string };
};

function toPublicUser(user: UserLike): PublicUser {
  const {
    password: _password,
    ...rest
  } = user.toObject();

  return {
    id: user._id.toString(),
    ...rest,
  };
}

function signToken(userId: string, role: UserRole) {
  const options: jwt.SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  };

  return jwt.sign({ sub: userId, role }, env.JWT_SECRET, options);
}

function parseDurationToMs(duration: string) {
  const match = /^(\d+)([smhd])$/.exec(duration);

  if (!match) {
    const numericValue = Number(duration);
    return Number.isFinite(numericValue) ? numericValue : undefined;
  }

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return undefined;
  }
}

function authCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: parseDurationToMs(env.JWT_EXPIRES_IN),
  };
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const role: UserRole = "patient";

  const existingUser = await UserModel.findOne({ email }).lean();
  if (existingUser) {
    throw new AppError("Email already in use", 409);
  }

  const password = await bcrypt.hash(input.password, 12);

  const user = await UserModel.create({
    name,
    email,
    password,
    role,
  });

  try {
    await getOrCreatePatientProfile(user._id.toString());
  } catch (error) {
    await UserModel.findByIdAndDelete(user._id);
    throw error;
  }

  const token = signToken(user._id.toString(), role);

  return {
    user: toPublicUser(user as UserLike),
    token,
    cookieOptions: authCookieOptions(),
  };
}

export async function loginUser(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();

  const user = await UserModel.findOne({ email }).select("+password");
  if (!user || !user.password) {
    throw new AppError("Invalid email or password", 401);
  }

  const passwordMatches = await bcrypt.compare(input.password, user.password);
  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = signToken(user._id.toString(), user.role);

  return {
    user: toPublicUser(user as UserLike),
    token,
    cookieOptions: authCookieOptions(),
  };
}

export async function createPasswordResetToken(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await UserModel.findOne({ email: normalizedEmail });

  if (!user) {
    return {
      created: false,
      resetLink: undefined,
    };
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = expiresAt;
  await user.save();

  const resetLink = `${env.CLIENT_URL}/reset-password?token=${resetToken}`;
  console.log(`[DocPulse] Password reset link for ${user.email}: ${resetLink}`);

  return {
    created: true,
    resetLink,
  };
}

export async function resetPassword(input: { token: string; password: string }) {
  const hashedToken = crypto.createHash("sha256").update(input.token).digest("hex");

  const user = await UserModel.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  user.password = await bcrypt.hash(input.password, 12);
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  return {
    message: "Password reset successful",
  };
}

export async function getCurrentUser(userId: string) {
  const user = await UserModel.findById(userId);

  if (!user || !user.isActive) {
    throw new AppError("User not found", 404);
  }

  return toPublicUser(user as UserLike);
}

export function setAuthCookie(
  cookieSetter: {
    cookie(name: string, value: string, options: ReturnType<typeof authCookieOptions>): void;
    clearCookie(name: string, options: ReturnType<typeof authCookieOptions>): void;
  },
  token: string,
) {
  cookieSetter.cookie(env.COOKIE_NAME, token, authCookieOptions());
}

export function clearAuthCookie(
  cookieSetter: {
    clearCookie(name: string, options: ReturnType<typeof authCookieOptions>): void;
  },
) {
  cookieSetter.clearCookie(env.COOKIE_NAME, authCookieOptions());
}

export function getAuthCookieName() {
  return env.COOKIE_NAME;
}
