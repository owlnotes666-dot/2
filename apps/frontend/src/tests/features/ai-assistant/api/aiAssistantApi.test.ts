/* eslint-disable @next/next/no-assign-module-variable */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: getSessionMock,
    },
  }),
}));

const API_BASE_URL = "http://localhost:8000";
const ACCESS_TOKEN = "test-access-token";

const chatPayload = {
  message: "Hello assistant",
  conversation_id: "conversation-123",
};

const chatResponse = {
  conversation_id: "conversation-123",
  message: "Hello! How can I help?",
  provider: "openrouter",
  model: "test-model",
  usage: null,
  sources: [],
  web_sources: [],
};

const conversationSummary = {
  id: "conversation-123",
  title: "Test conversation",
  created_at: "2026-01-01T10:00:00Z",
  updated_at: "2026-01-01T10:00:00Z",
};

function mockResponse(
  data: unknown,
  ok = true,
): Response {
  return {
    ok,
    json: vi.fn().mockResolvedValue(data),
  } as unknown as Response;
}

describe("aiAssistantApi", () => {
  let api: typeof import("@/features/ai-assistant/api/aiAssistantApi").aiAssistantApi;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    vi.stubEnv("NEXT_PUBLIC_API_URL", API_BASE_URL);

    getSessionMock.mockResolvedValue({
      data: {
        session: {
          access_token: ACCESS_TOKEN,
        },
      },
      error: null,
    });

    vi.stubGlobal("fetch", vi.fn());

    const module = await import(
      "@/features/ai-assistant/api/aiAssistantApi"
    );

    api = module.aiAssistantApi;
  });

  describe("sendMessage", () => {
    it("should send a chat request successfully", async () => {
      vi.mocked(fetch).mockResolvedValue(
        mockResponse(chatResponse),
      );

      const result = await api.sendMessage(chatPayload);

      expect(result).toEqual(chatResponse);
      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/v1/ai-assistant/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ACCESS_TOKEN}`,
          },
          body: JSON.stringify(chatPayload),
        },
      );
    });

    it("should throw when API URL is not configured", async () => {
      vi.stubEnv("NEXT_PUBLIC_API_URL", "");

      vi.resetModules();

      // eslint-disable-next-line @next/next/no-assign-module-variable
      const module = await import(
        "@/features/ai-assistant/api/aiAssistantApi"
      );

      await expect(
        module.aiAssistantApi.sendMessage(chatPayload),
      ).rejects.toThrow("Backend API URL is not configured.");

      expect(fetch).not.toHaveBeenCalled();
    });

    it("should throw when the session is expired", async () => {
      getSessionMock.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await expect(
        api.sendMessage(chatPayload),
      ).rejects.toThrow(
        "Your session has expired. Please sign in again.",
      );

      expect(fetch).not.toHaveBeenCalled();
    });

    it("should throw when getting the session fails", async () => {
      getSessionMock.mockResolvedValue({
        data: { session: null },
        error: new Error("Session error"),
      });

      await expect(
        api.sendMessage(chatPayload),
      ).rejects.toThrow(
        "Your session has expired. Please sign in again.",
      );
    });

    it("should throw the backend error detail", async () => {
      vi.mocked(fetch).mockResolvedValue(
        mockResponse(
          { detail: "Invalid request" },
          false,
        ),
      );

      await expect(
        api.sendMessage(chatPayload),
      ).rejects.toThrow("Invalid request");
    });

    it("should use the default error when backend detail is missing", async () => {
      vi.mocked(fetch).mockResolvedValue(
        mockResponse({}, false),
      );

      await expect(
        api.sendMessage(chatPayload),
      ).rejects.toThrow(
        "Unable to get a response from AI Assistant.",
      );
    });
  });

  describe("uploadFile", () => {
    it("should upload a file successfully", async () => {
      const file = new File(["test content"], "report.pdf", {
        type: "application/pdf",
      });

      const uploadResponse = {
        conversation_id: "conversation-123",
        filename: "report.pdf",
        message: "File uploaded successfully",
      };

      vi.mocked(fetch).mockResolvedValue(
        mockResponse(uploadResponse),
      );

      const result = await api.uploadFile(
        "conversation-123",
        file,
      );

      expect(result).toEqual(uploadResponse);

      const [url, options] = vi.mocked(fetch).mock.calls[0];

      expect(url).toBe(
        `${API_BASE_URL}/api/v1/ai-assistant/files/upload`,
      );

      expect(options?.method).toBe("POST");
      expect(options?.headers).toEqual({
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      });

      expect(options?.body).toBeInstanceOf(FormData);

      const formData = options?.body as FormData;

      expect(formData.get("conversation_id")).toBe(
        "conversation-123",
      );
      expect(formData.get("file")).toBe(file);
    });

    it("should throw when the upload fails", async () => {
      const file = new File(["test"], "report.pdf");

      vi.mocked(fetch).mockResolvedValue(
        mockResponse(
          { detail: "File type not supported" },
          false,
        ),
      );

      await expect(
        api.uploadFile("conversation-123", file),
      ).rejects.toThrow("File type not supported");
    });

    it("should use the default upload error when detail is missing", async () => {
      const file = new File(["test"], "report.pdf");

      vi.mocked(fetch).mockResolvedValue(
        mockResponse({}, false),
      );

      await expect(
        api.uploadFile("conversation-123", file),
      ).rejects.toThrow("Unable to upload report.pdf.");
    });

    it("should throw when API URL is not configured", async () => {
      vi.stubEnv("NEXT_PUBLIC_API_URL", "");

      vi.resetModules();

      const module = await import(
        "@/features/ai-assistant/api/aiAssistantApi"
      );

      const file = new File(["test"], "report.pdf");

      await expect(
        module.aiAssistantApi.uploadFile(
          "conversation-123",
          file,
        ),
      ).rejects.toThrow("Backend API URL is not configured.");

      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe("listConversations", () => {
    it("should retrieve conversations successfully", async () => {
      const conversations = [conversationSummary];

      vi.mocked(fetch).mockResolvedValue(
        mockResponse(conversations),
      );

      const result = await api.listConversations();

      expect(result).toEqual(conversations);

      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/v1/ai-assistant/conversations`,
        {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
          },
        },
      );
    });

    it("should throw when retrieving conversations fails", async () => {
      vi.mocked(fetch).mockResolvedValue(
        mockResponse({}, false),
      );

      await expect(
        api.listConversations(),
      ).rejects.toThrow(
        "Unable to retrieve conversations.",
      );
    });
  });

  describe("getConversation", () => {
    it("should retrieve a conversation successfully", async () => {
      const conversationHistory = {
        conversation: {
          ...conversationSummary,
          owner_id: "user-123",
        },
        messages: [],
      };

      vi.mocked(fetch).mockResolvedValue(
        mockResponse(conversationHistory),
      );

      const result = await api.getConversation(
        "conversation-123",
      );

      expect(result).toEqual(conversationHistory);

      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/v1/ai-assistant/conversations/conversation-123`,
        {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
          },
        },
      );
    });

    it("should throw when retrieving a conversation fails", async () => {
      vi.mocked(fetch).mockResolvedValue(
        mockResponse({}, false),
      );

      await expect(
        api.getConversation("conversation-123"),
      ).rejects.toThrow(
        "Unable to retrieve conversation.",
      );
    });
  });

  describe("deleteConversation", () => {
    it("should delete a conversation successfully", async () => {
      vi.mocked(fetch).mockResolvedValue(
        mockResponse(null),
      );

      await expect(
        api.deleteConversation("conversation-123"),
      ).resolves.toBeUndefined();

      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/v1/ai-assistant/conversations/conversation-123`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
          },
        },
      );
    });

    it("should throw when deleting a conversation fails", async () => {
      vi.mocked(fetch).mockResolvedValue(
        mockResponse({}, false),
      );

      await expect(
        api.deleteConversation("conversation-123"),
      ).rejects.toThrow(
        "Unable to delete conversation.",
      );
    });
  });
});