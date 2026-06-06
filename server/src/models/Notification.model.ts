import { Schema, model, type InferSchemaType } from "mongoose";
import { notificationTypes } from "./types.js";

const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: notificationTypes,
      default: "system",
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type NotificationDocument = InferSchemaType<typeof NotificationSchema>;
export const NotificationModel = model("Notification", NotificationSchema);
