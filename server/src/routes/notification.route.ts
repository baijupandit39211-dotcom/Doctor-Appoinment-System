import { Router } from "express";

import {
  deleteNotification,
  listMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../controllers/notification.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const notificationRouter = Router();

notificationRouter.get("/me", requireAuth, listMyNotifications);
notificationRouter.patch("/read-all", requireAuth, markAllNotificationsAsRead);
notificationRouter.patch("/:id/read", requireAuth, markNotificationAsRead);
notificationRouter.delete("/:id", requireAuth, deleteNotification);
