import { apiClient } from "@/lib/apiClient";
import type { AccessTokenResponse, User } from "@/types/auth";

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  full_name: string;
}

export interface ChangeEmailPayload {
  new_email: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export async function registerRequest(payload: RegisterPayload) {
  const { data } = await apiClient.post<AccessTokenResponse>("/auth/register", payload);
  return data;
}

export async function loginRequest(payload: LoginPayload) {
  const { data } = await apiClient.post<AccessTokenResponse>("/auth/login", payload);
  return data;
}

export async function refreshRequest() {
  const { data } = await apiClient.post<AccessTokenResponse>("/auth/refresh");
  return data;
}

export async function logoutRequest() {
  await apiClient.post("/auth/logout");
}

export async function updateProfileRequest(payload: UpdateProfilePayload) {
  const { data } = await apiClient.patch<User>("/auth/me", payload);
  return data;
}

export async function changeEmailRequest(payload: ChangeEmailPayload) {
  const { data } = await apiClient.post<User>("/auth/me/email", payload);
  return data;
}

export async function changePasswordRequest(payload: ChangePasswordPayload) {
  await apiClient.post("/auth/me/password", payload);
}
