import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDoctor } from "../api/doctorService";

export function useCreateDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDoctor,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["doctors", "list"],
      });
    },
  });
}
