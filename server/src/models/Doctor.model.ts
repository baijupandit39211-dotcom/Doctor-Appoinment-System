import { Schema, model, type InferSchemaType } from "mongoose";
import { doctorProfileStatuses } from "./types.js";

const DoctorSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic" },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department" },
    specialization: { type: String, required: true, trim: true },
    qualification: { type: String },
    experienceYears: { type: Number, default: 0 },
    consultationFee: { type: Number, default: 0 },
    bio: { type: String },
    languages: [{ type: String, trim: true }],
    profileStatus: {
      type: String,
      enum: doctorProfileStatuses,
      default: "pending",
    },
    isPublic: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: false },
  },
  { timestamps: true },
);

DoctorSchema.index({ userId: 1 }, { unique: true });

export type DoctorDocument = InferSchemaType<typeof DoctorSchema>;
export const DoctorModel = model("Doctor", DoctorSchema);
