import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateDoctorStatus } from "../api/doctorService";

interface UpdateDoctorStatusInput {
  id: string;
  status: "Active" | "Inactive";
}

export function useUpdateDoctorStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: UpdateDoctorStatusInput) =>
      updateDoctorStatus(id, status),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["doctors", "list"],
      });
    },
  });
}