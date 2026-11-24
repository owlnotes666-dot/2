import { useMutation, useQueryClient } from "@tanstack/react-query";

import { profileKeys, profileService } from "../api";

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileService.updateProfile,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: profileKeys.all,
      });
    },
  });
};