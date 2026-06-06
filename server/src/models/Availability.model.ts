import { Schema, model, type InferSchemaType } from "mongoose";
import { daysOfWeek } from "./types.js";

const AvailabilitySchema = new Schema(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic" },
    dayOfWeek: {
      type: String,
      enum: daysOfWeek,
      required: true,
    },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    slotDurationMinutes: { type: Number, default: 30 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type AvailabilityDocument = InferSchemaType<typeof AvailabilitySchema>;
export const AvailabilityModel = model("Availability", AvailabilitySchema);
