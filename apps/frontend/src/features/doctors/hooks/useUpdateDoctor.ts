import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateDoctor } from "../api/doctorService";

export function useUpdateDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDoctor,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["doctors", "list"],
      });
    },
  });
}
