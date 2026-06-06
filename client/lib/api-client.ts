import { API_BASE_URL } from "./api";

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  unreadCount?: number;
};

export async function requestJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok) {
    throw new Error(payload?.message ?? "Request failed");
  }

  return payload as ApiResponse<T>;
}
