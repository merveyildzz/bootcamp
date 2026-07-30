import { apiClient } from "@/lib/apiClient";
import type { AccessTokenResponse } from "@/types/auth";

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
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
