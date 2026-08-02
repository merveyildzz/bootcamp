import { apiClient } from "@/lib/apiClient";
import type { StatsOverview } from "@/types/stats";

export async function getOverview() {
  const { data } = await apiClient.get<StatsOverview>("/stats/overview");
  return data;
}
