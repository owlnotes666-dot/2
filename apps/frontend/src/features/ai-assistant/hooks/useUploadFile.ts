import { useMutation } from "@tanstack/react-query";

import { aiAssistantApi } from "../api/aiAssistantApi";

interface UploadFileVariables {
  conversationId: string;
  file: File;
}

export const useUploadFile = () => {
  const mutation = useMutation({
    mutationKey: ["ai-assistant", "upload-file"],
    mutationFn: ({ conversationId, file }: UploadFileVariables) =>
      aiAssistantApi.uploadFile(conversationId, file),
  });

  return {
    uploadFile: mutation.mutateAsync,
    isUploading: mutation.isPending,
    uploadError: mutation.error,
    resetUpload: mutation.reset,
  };
};