import { Schema, model, type InferSchemaType } from "mongoose";

const DepartmentSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type DepartmentDocument = InferSchemaType<typeof DepartmentSchema>;
export const DepartmentModel = model("Department", DepartmentSchema);
