import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createService } from "../api/serviceApi.js";

// Custom hook to register a new service.
// On success, invalidates the "services" queries so the services table updates live without reload.
export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

export default useCreateService;
