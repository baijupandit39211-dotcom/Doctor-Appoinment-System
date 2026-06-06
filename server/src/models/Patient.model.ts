import { Schema, model, type InferSchemaType } from "mongoose";
import { genders } from "./types.js";

const PatientSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: genders,
    },
    address: { type: String },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relation: { type: String },
    },
  },
  { timestamps: true },
);

export type PatientDocument = InferSchemaType<typeof PatientSchema>;
export const PatientModel = model("Patient", PatientSchema);
