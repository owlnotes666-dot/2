import { createClient } from "@/lib/supabase/client";
import type {
  ChatRequest,
  ChatResponse,
  FileUploadResponse,
  ConversationSummary,
  ConversationHistory,
} from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const supabase = createClient();

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  return session.access_token;
}

export const aiAssistantApi = {
  async sendMessage(payload: ChatRequest): Promise<ChatResponse> {
    if (!API_BASE_URL) {
      throw new Error("Backend API URL is not configured.");
    }

    const accessToken = await getAccessToken();

    const response = await fetch(`${API_BASE_URL}/api/v1/ai-assistant/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);

      throw new Error(
        errorData?.detail || "Unable to get a response from AI Assistant.",
      );
    }

    return response.json() as Promise<ChatResponse>;
  },

  async uploadFile(
    conversationId: string,
    file: File,
  ): Promise<FileUploadResponse> {
    if (!API_BASE_URL) {
      throw new Error("Backend API URL is not configured.");
    }

    const accessToken = await getAccessToken();
    const formData = new FormData();

    formData.append("conversation_id", conversationId);
    formData.append("file", file);

    const response = await fetch(
      `${API_BASE_URL}/api/v1/ai-assistant/files/upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);

      throw new Error(errorData?.detail || `Unable to upload ${file.name}.`);
    }

    return response.json() as Promise<FileUploadResponse>;
  },

  async listConversations(): Promise<ConversationSummary[]> {
    const accessToken = await getAccessToken();

    const response = await fetch(
      `${API_BASE_URL}/api/v1/ai-assistant/conversations`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Unable to retrieve conversations.");
    }

    return response.json();
  },

  async getConversation(conversationId: string): Promise<ConversationHistory> {
    const accessToken = await getAccessToken();

    const response = await fetch(
      `${API_BASE_URL}/api/v1/ai-assistant/conversations/${conversationId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Unable to retrieve conversation.");
    }

    return response.json();
  },

  async deleteConversation(conversationId: string): Promise<void> {
    const accessToken = await getAccessToken();

    const response = await fetch(
      `${API_BASE_URL}/api/v1/ai-assistant/conversations/${conversationId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Unable to delete conversation.");
    }
  },
};
