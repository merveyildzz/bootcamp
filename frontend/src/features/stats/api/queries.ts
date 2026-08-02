import { useQuery } from "@tanstack/react-query";
import * as statsApi from "@/features/stats/api/statsApi";

export function useStatsOverview() {
  return useQuery({ queryKey: ["stats", "overview"], queryFn: statsApi.getOverview });
}
