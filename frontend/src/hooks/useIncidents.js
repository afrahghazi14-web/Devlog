import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getIncidents, getIncidentById } from "../api/incidentApi.js";

// Custom hook to fetch paginated incidents with status filter.
// Uses keepPreviousData so the UI retains the current rows while fetching the next page.
export function useIncidents({ status = "ALL", page = 1, limit = 10 } = {}) {
  return useQuery({
    queryKey: ["incidents", { status, page, limit }],
    queryFn: () => getIncidents({ status, page, limit }),
    placeholderData: keepPreviousData,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
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

export { useCreateIncident } from "./useCreateIncident.js";
export { useResolveIncident } from "./useResolveIncident.js";

