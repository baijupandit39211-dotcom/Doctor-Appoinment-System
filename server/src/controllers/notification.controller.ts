import type { NextFunction, Request, Response } from "express";

import { NotificationModel } from "../models/Notification.model.js";
import { syncNotificationUnreadCount } from "../services/notification.service.js";
import { AppError } from "../utils/appError.js";

function getNotificationId(req: Request) {
  const notificationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!notificationId) {
    throw new AppError("Notification id is required", 400);
  }
  return notificationId;
}

async function getOwnNotificationOrThrow(notificationId: string, userId: string) {
  const notification = await NotificationModel.findOne({ _id: notificationId, userId });
  if (!notification) {
    throw new AppError("Notification not found", 404);
  }
  return notification;
}

export async function listMyNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const notifications = await NotificationModel.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    const unreadCount = await NotificationModel.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      message: "Notifications fetched successfully",
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const notificationId = getNotificationId(req);
    const notification = await getOwnNotificationOrThrow(notificationId, req.user._id.toString());

    notification.isRead = true;
    await notification.save();
    await syncNotificationUnreadCount(req.user._id.toString(), "read", notification._id.toString());

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

export async function markAllNotificationsAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const result = await NotificationModel.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true } },
    );
    await syncNotificationUnreadCount(req.user._id.toString(), "read-all");

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteNotification(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const notificationId = getNotificationId(req);
    const notification = await getOwnNotificationOrThrow(notificationId, req.user._id.toString());

    await NotificationModel.findByIdAndDelete(notification._id);
    await syncNotificationUnreadCount(req.user._id.toString(), "delete", notification._id.toString());

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}
