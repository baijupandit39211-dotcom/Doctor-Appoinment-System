import { requestJson } from "./api-client";

export type AuthRole = "patient" | "doctor" | "clinic_admin" | "super_admin";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: AuthRole;
  avatar?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export async function loginUser(input: { email: string; password: string }) {
  return requestJson<AuthUser>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  return requestJson<AuthUser>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function logoutUser() {
  return requestJson<null>("/api/auth/logout", {
    method: "POST",
  });
}

export async function getCurrentUser() {
  return requestJson<AuthUser>("/api/auth/me", {
    method: "GET",
  });
}

export async function sendPasswordResetLink(input: { email: string }) {
  return requestJson<null>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function resetPassword(input: { token: string; password: string }) {
  return requestJson<null>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
