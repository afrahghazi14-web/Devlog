import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resolveIncident } from "../api/incidentApi.js";

// Custom hook to resolve an incident with post-mortem details.
// On success, invalidates incidents list, stats dashboard metrics, and the individual incident cache.
export function useResolveIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => resolveIncident(id, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ["incident", variables.id] });
      }
    },
  });
}

export default useResolveIncident;
