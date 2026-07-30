import { AxiosError } from "axios";

export function getApiErrorMessage(error: unknown, fallback = "Bir şeyler ters gitti, lütfen tekrar deneyin."): string {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
  }
  return fallback;
}
