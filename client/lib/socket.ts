import { io, type Socket } from "socket.io-client";

import { API_BASE_URL } from "./api";

let notificationSocket: Socket | null = null;

export function getNotificationSocket() {
  if (!notificationSocket) {
    notificationSocket = io(API_BASE_URL, {
      autoConnect: false,
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
  }

  return notificationSocket;
}

export function disconnectNotificationSocket() {
  if (notificationSocket) {
    notificationSocket.disconnect();
    notificationSocket = null;
  }
}
