import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { getOrCreateDoctorProfile } from "./doctor.service.js";
import { getOrCreatePatientProfile } from "./patient.service.js";
import { queueNotificationForAdmins } from "./notification.service.js";
import { AppError } from "../utils/appError.js";
import { UserModel, type UserDocument } from "../models/User.model.js";
import { userRoles, type UserRole } from "../models/types.js";

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

function validateRole(role?: string): UserRole {
  const normalizedRole = role ?? "patient";

  if (!userRoles.includes(normalizedRole as UserRole)) {
    throw new AppError("Invalid role", 400);
  }

  return normalizedRole as UserRole;
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
  role?: string;
}) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const role = validateRole(input.role);

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

  if (role === "patient") {
    try {
      await getOrCreatePatientProfile(user._id.toString());
    } catch (error) {
      await UserModel.findByIdAndDelete(user._id);
      throw error;
    }
  } else if (role === "doctor") {
    try {
      await getOrCreateDoctorProfile(user._id.toString());
      void queueNotificationForAdmins({
        title: "New doctor registration",
        message: `${name} registered as a doctor and is waiting for approval.`,
        type: "system",
      });
    } catch (error) {
      await UserModel.findByIdAndDelete(user._id);
      throw error;
    }
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
