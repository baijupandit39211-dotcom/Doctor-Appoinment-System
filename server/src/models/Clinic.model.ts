import { Schema, model, type InferSchemaType } from "mongoose";

const ClinicSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    city: { type: String },
    logo: { type: String },
    adminId: { type: Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type ClinicDocument = InferSchemaType<typeof ClinicSchema>;
export const ClinicModel = model("Clinic", ClinicSchema);
