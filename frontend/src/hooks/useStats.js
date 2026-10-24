import { useQuery } from "@tanstack/react-query";
import { getStats, getServiceStats } from "../api/statsApi.js";

// Custom hook to fetch incident dashboard statistics
export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
}

// Custom hook to fetch service-level resolution time analytics and rankings
export function useServiceStats() {
  return useQuery({
    queryKey: ["stats", "services"],
    queryFn: getServiceStats,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
}


