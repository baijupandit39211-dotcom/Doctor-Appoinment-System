import { NotificationModel, type NotificationDocument } from "../models/Notification.model.js";
import { UserModel } from "../models/User.model.js";
import { type NotificationType } from "../models/types.js";
import {
  emitNotificationSyncToUser,
  emitNotificationToUser,
  type NotificationSocketPayload,
} from "../realtime/socket.js";

type CreateNotificationInput = {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  isRead?: boolean;
};

function getDocumentId(value: unknown) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    const maybeId = (value as { _id?: unknown })._id;
    if (maybeId) {
      return getDocumentId(maybeId);
    }

    if ("toString" in value) {
      return value.toString();
    }
  }

  return "";
}

function serializeNotification(notification: NotificationDocument & { _id?: unknown; userId?: unknown }): NotificationSocketPayload {
  const notificationWithTimestamps = notification as NotificationDocument & {
    createdAt?: Date;
    updatedAt?: Date;
  };

  return {
    _id: getDocumentId(notification._id ?? notification),
    userId: getDocumentId(notification.userId),
    title: notification.title,
    message: notification.message,
    type: notification.type,
    isRead: notification.isRead,
    createdAt: notificationWithTimestamps.createdAt ? notificationWithTimestamps.createdAt.toISOString() : undefined,
    updatedAt: notificationWithTimestamps.updatedAt ? notificationWithTimestamps.updatedAt.toISOString() : undefined,
  };
}

export async function queueNotificationForUser(input: CreateNotificationInput) {
  try {
    const notification = await NotificationModel.create({
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type ?? "system",
      isRead: input.isRead ?? false,
    });

    const serializedNotification = serializeNotification(notification as NotificationDocument & { _id?: unknown; userId?: unknown });
    emitNotificationToUser(input.userId, serializedNotification);
    return serializedNotification;
  } catch (error) {
    console.error("Failed to queue notification:", error);
    return null;
  }
}

export async function queueNotificationsForUsers(
  userIds: string[],
  input: Omit<CreateNotificationInput, "userId">,
  options?: { excludeUserIds?: string[] },
) {
  const excludedUserIds = new Set(options?.excludeUserIds ?? []);
  const uniqueUserIds = [...new Set(userIds.filter((userId) => Boolean(userId) && !excludedUserIds.has(userId)))];
  const results = await Promise.all(
    uniqueUserIds.map((userId) =>
      queueNotificationForUser({
        userId,
        ...input,
      }),
    ),
  );

  return results.filter(Boolean);
}

export async function queueNotificationForAdmins(
  input: Omit<CreateNotificationInput, "userId">,
  options?: { excludeUserIds?: string[] },
) {
  const admins = await UserModel.find({
    role: { $in: ["clinic_admin", "super_admin"] },
    isActive: true,
  }).select("_id");

  return queueNotificationsForUsers(
    admins.map((admin) => admin._id.toString()),
    input,
    options,
  );
}

export async function queueNotificationForDoctorUser(doctorUserId: string, input: Omit<CreateNotificationInput, "userId">) {
  return queueNotificationForUser({
    userId: doctorUserId,
    ...input,
  });
}

export async function queueNotificationForPatientUser(patientUserId: string, input: Omit<CreateNotificationInput, "userId">) {
  return queueNotificationForUser({
    userId: patientUserId,
    ...input,
  });
}

export async function syncNotificationUnreadCount(
  userId: string,
  action: "read" | "delete" | "read-all" = "read",
  notificationId?: string,
) {
  const unreadCount = await NotificationModel.countDocuments({ userId, isRead: false });
  emitNotificationSyncToUser(userId, { unreadCount, action, notificationId });
  return unreadCount;
}
