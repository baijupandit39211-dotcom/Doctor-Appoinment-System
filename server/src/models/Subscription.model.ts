import { Schema, model, type InferSchemaType } from "mongoose";
import { subscriptionPlans, subscriptionStatuses } from "./types.js";

const SubscriptionSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true },
    plan: {
      type: String,
      enum: subscriptionPlans,
      default: "starter",
    },
    status: {
      type: String,
      enum: subscriptionStatuses,
      default: "active",
    },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true },
);

export type SubscriptionDocument = InferSchemaType<typeof SubscriptionSchema>;
export const SubscriptionModel = model("Subscription", SubscriptionSchema);
