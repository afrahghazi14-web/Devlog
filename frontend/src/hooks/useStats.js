import { useQuery } from "@tanstack/react-query";
import { getStats } from "../api/statsApi.js";

// Custom hook to fetch incident dashboard statistics
export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
  });
}
