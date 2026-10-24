import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createIncident } from "../api/incidentApi.js";

// Custom hook to create a new incident.
// On success, invalidates the "incidents" queries and "stats" metrics so the UI updates live.
export function useCreateIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createIncident(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export default useCreateIncident;
