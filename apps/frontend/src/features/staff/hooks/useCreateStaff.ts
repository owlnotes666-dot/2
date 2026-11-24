"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createStaff } from "../api/staffService";
import { queryKeys } from "@/shared/lib/queryKeys";

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.staff.all,
      });
    },
  });
}