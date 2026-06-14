import type { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { Server, type Socket } from "socket.io";

import { env } from "../config/env.js";
import { UserModel } from "../models/User.model.js";

export type NotificationSocketPayload = {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type SocketUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type SocketData = {
  user?: SocketUser;
};

let io: Server | null = null;

function parseCookieHeader(cookieHeader?: string) {
  const cookies: Record<string, string> = {};

  if (!cookieHeader) {
    return cookies;
  }

  for (const cookiePart of cookieHeader.split(";")) {
    const [rawKey, ...rawValueParts] = cookiePart.split("=");
    const key = rawKey?.trim();
    if (!key) {
      continue;
    }

    cookies[key] = decodeURIComponent(rawValueParts.join("=").trim());
  }

  return cookies;
}

function getSocketToken(socket: Socket) {
  const cookies = parseCookieHeader(socket.handshake.headers.cookie);
  return cookies[env.COOKIE_NAME] ?? socket.handshake.auth?.token ?? undefined;
}

async function authenticateSocket(socket: Socket<any, any, any, SocketData>, next: (error?: Error) => void) {
  try {
    const token = getSocketToken(socket);
    if (!token) {
      next(new Error("Unauthorized"));
      return;
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    const userId = typeof payload.sub === "string" ? payload.sub : undefined;

    if (!userId) {
      next(new Error("Unauthorized"));
      return;
    }

    const user = await UserModel.findById(userId).select("name email role isActive");
    if (!user || !user.isActive) {
      next(new Error("Unauthorized"));
      return;
    }

    socket.data.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch {
    next(new Error("Unauthorized"));
  }
}

export function initializeSocketServer(httpServer: HttpServer) {
  if (io) {
    return io;
  }

  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const userId = socket.data.user?.id;

    if (!userId) {
      socket.disconnect(true);
      return;
    }

    socket.join(`user:${userId}`);
  });

  return io;
}

export function emitNotificationToUser(userId: string, notification: NotificationSocketPayload) {
  io?.to(`user:${userId}`).emit("notification:new", notification);
}

export function emitNotificationSyncToUser(
  userId: string,
  payload: { unreadCount?: number; notificationId?: string; action: "read" | "delete" | "read-all" },
) {
  io?.to(`user:${userId}`).emit("notification:sync", payload);
}

export function getSocketServer() {
  return io;
}
