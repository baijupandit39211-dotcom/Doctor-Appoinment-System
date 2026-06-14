import { API_BASE_URL } from "./api";
import { emitToast } from "./toast";
import { getFriendlyErrorMessage } from "./feedback";

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  unreadCount?: number;
};

export type RequestFeedbackOptions = {
  toast?: boolean;
  successMessage?: string;
  errorMessage?: string;
};

export async function requestJson<T>(path: string, init?: RequestInit, feedbackOptions?: RequestFeedbackOptions) {
  const method = (init?.method ?? "GET").toUpperCase();
  const shouldToast = (method !== "GET" && method !== "HEAD") && feedbackOptions?.toast !== false;
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    const errorMessage = feedbackOptions?.errorMessage ?? getDefaultErrorMessage(path, method, init?.body);
    if (shouldToast) {
      emitToast({
        variant: "error",
        title: "Action failed",
        message: errorMessage,
      });
    }
    throw new Error(errorMessage);
  }

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok) {
    const errorMessage = getFriendlyErrorMessage(
      feedbackOptions?.errorMessage ?? payload?.message ?? "Request failed",
      getDefaultErrorMessage(path, method, init?.body),
    );

    if (shouldToast) {
      emitToast({
        variant: "error",
        title: "Action failed",
        message: errorMessage,
      });
    }

    throw new Error(errorMessage);
  }

  if (shouldToast) {
    emitToast({
      variant: "success",
      title: "Success",
      message:
        feedbackOptions?.successMessage?.trim() ||
        payload?.message?.trim() ||
        getDefaultSuccessMessage(path, method, init?.body),
    });
  }

  return payload as ApiResponse<T>;
}

function parseJsonBody(body: BodyInit | null | undefined) {
  if (typeof body !== "string") {
    return null;
  }

  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getDefaultSuccessMessage(path: string, method: string, body?: BodyInit | null) {
  if (path.includes("/api/auth/login")) {
    return "Login successful.";
  }

  if (path.includes("/api/auth/logout")) {
    return "Logged out successfully.";
  }

  if (path.includes("/api/auth/register")) {
    return "Registration successful.";
  }

  if (path.includes("/api/auth/forgot-password")) {
    return "Password reset link sent.";
  }

  if (path.includes("/api/auth/reset-password")) {
    return "Password updated successfully.";
  }

  if (path.includes("/api/doctors")) {
    if (method === "DELETE") {
      return "Doctor deleted successfully.";
    }
    if (method === "PATCH") {
      return "Doctor updated successfully.";
    }
    return "Doctor created successfully.";
  }

  if (path.includes("/api/appointments")) {
    if (path.includes("/cancel")) {
      return "Appointment cancelled successfully.";
    }
    if (path.includes("/status")) {
      const parsedBody = parseJsonBody(body);
      const statusValue = typeof parsedBody?.status === "string" ? parsedBody.status.trim().toLowerCase() : "";
      if (statusValue) {
        return `Appointment ${statusValue.replace(/[_-]+/g, " ")} successfully.`;
      }
      return "Appointment status updated successfully.";
    }
    if (method === "POST") {
      return "Appointment booked successfully.";
    }
    return "Appointment updated successfully.";
  }

  if (path.includes("/api/availability")) {
    if (method === "DELETE") {
      return "Availability deleted successfully.";
    }
    if (method === "PATCH") {
      return "Availability updated successfully.";
    }
    return "Availability created successfully.";
  }

  if (path.includes("/api/notifications")) {
    if (method === "DELETE") {
      return "Notification deleted successfully.";
    }
    if (path.includes("/read-all")) {
      return "Notifications marked as read.";
    }
    if (path.includes("/read")) {
      return "Notification marked as read.";
    }
  }

  if (path.includes("/api/patients")) {
    return "Profile updated successfully.";
  }

  return "Action completed successfully.";
}

function getDefaultErrorMessage(path: string, method: string, body?: BodyInit | null) {
  if (path.includes("/api/auth/login")) {
    return "Invalid email or password.";
  }

  if (path.includes("/api/auth/logout")) {
    return "Unable to log out right now.";
  }

  if (path.includes("/api/auth/register")) {
    return "Registration failed. Please check the form and try again.";
  }

  if (path.includes("/api/auth/forgot-password")) {
    return "Unable to send the reset link.";
  }

  if (path.includes("/api/auth/reset-password")) {
    return "Unable to reset the password.";
  }

  if (path.includes("/api/doctors")) {
    if (method === "DELETE") {
      return "Unable to delete the doctor.";
    }
    if (method === "PATCH") {
      return "Unable to update the doctor.";
    }
    return "Unable to create the doctor.";
  }

  if (path.includes("/api/appointments")) {
    if (path.includes("/cancel")) {
      return "Unable to cancel the appointment.";
    }
    if (path.includes("/status")) {
      const parsedBody = parseJsonBody(body);
      const statusValue = typeof parsedBody?.status === "string" ? parsedBody.status.trim().toLowerCase() : "";
      if (statusValue) {
        return `Unable to update the appointment to ${statusValue.replace(/[_-]+/g, " ")}.`;
      }
      return "Unable to update the appointment status.";
    }
    if (method === "POST") {
      return "Appointment booking failed.";
    }
    return "Unable to update the appointment.";
  }

  if (path.includes("/api/availability")) {
    if (method === "DELETE") {
      return "Unable to delete the availability slot.";
    }
    if (method === "PATCH") {
      return "Unable to update the availability slot.";
    }
    return "Unable to create the availability slot.";
  }

  if (path.includes("/api/notifications")) {
    if (method === "DELETE") {
      return "Unable to delete the notification.";
    }
    return "Unable to update the notification.";
  }

  if (path.includes("/api/patients")) {
    return "Unable to update the profile.";
  }

  return "Something went wrong. Please try again.";
}
