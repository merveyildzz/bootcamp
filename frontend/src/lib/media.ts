// Same fallback as apiClient.ts — VITE_API_BASE_URL is only set explicitly in Docker, so
// native `npm run dev` without a frontend/.env would otherwise produce broken "undefined/..."
// image URLs.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export function mediaUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
