import { useQuery } from "@tanstack/react-query";
import { getServiceStats } from "../api/statsApi.js";

// Custom hook to fetch service-level resolution time analytics and rankings.
// Uses queryKey ["stats", "services"] so it automatically invalidates alongside ["stats"].
export function useServiceStats() {
  return useQuery({
    queryKey: ["stats", "services"],
    queryFn: getServiceStats,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
}

export default useServiceStats;
