import { useQuery } from "@tanstack/react-query";
import { getServices } from "../api/serviceApi.js";

// Custom hook to fetch all registered services
export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: getServices,
  });
}
