import { useQuery } from "@tanstack/react-query";
import { getIncidents, getIncidentById } from "../api/incidentApi.js";

// Custom hook to fetch paginated incidents with status filter
export function useIncidents({ status = "ALL", page = 1, limit = 10 } = {}) {
  return useQuery({
    queryKey: ["incidents", { status, page, limit }],
    queryFn: () => getIncidents({ status, page, limit }),
  });
}

// Custom hook to fetch a single incident by ID
export function useIncident(id) {
  return useQuery({
    queryKey: ["incident", id],
    queryFn: () => getIncidentById(id),
    enabled: Boolean(id),
  });
}
