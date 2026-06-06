import { Schema, model, type HydratedDocument } from "mongoose";
import { userRoles } from "./types.js";

export interface User {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: (typeof userRoles)[number];
  avatar?: string;
  isActive: boolean;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<User>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    phone: { type: String },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: userRoles,
      default: "patient",
    },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    passwordResetToken: { type: String, select: false, default: null },
    passwordResetExpires: { type: Date, select: false, default: null },
  },
  { timestamps: true },
);

export type UserDocument = HydratedDocument<User>;
export const UserModel = model<User>("User", UserSchema);
