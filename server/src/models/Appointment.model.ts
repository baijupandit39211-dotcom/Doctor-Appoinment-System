import { Schema, model, type InferSchemaType } from "mongoose";
import { appointmentStatuses, cancelledByValues } from "./types.js";

const AppointmentSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic" },
    appointmentDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String },
    reason: { type: String },
    status: {
      type: String,
      enum: appointmentStatuses,
      default: "pending",
    },
    notes: { type: String },
    cancelledBy: {
      type: String,
      enum: [...cancelledByValues, null],
      default: null,
    },
    cancellationReason: { type: String },
  },
  { timestamps: true },
);

AppointmentSchema.index({ doctorId: 1, appointmentDate: 1, startTime: 1 }, { unique: true });

export type AppointmentDocument = InferSchemaType<typeof AppointmentSchema>;
export const AppointmentModel = model("Appointment", AppointmentSchema);
