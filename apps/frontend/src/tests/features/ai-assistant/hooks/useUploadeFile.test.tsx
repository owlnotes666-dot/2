// useUploadFile.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { aiAssistantApi } from "@/features/ai-assistant/api/aiAssistantApi";
import { useUploadFile } from "@/features/ai-assistant/hooks/useUploadFile";

// ─── Mock API ───────────────────────────────────────────────
vi.mock("@/features/ai-assistant/api/aiAssistantApi", () => ({
  aiAssistantApi: {
    uploadFile: vi.fn(),
  },
}));

const mockedApi = vi.mocked(aiAssistantApi);

// ─── Test Helpers ───────────────────────────────────────────
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

// ─── Fake File Helper ───────────────────────────────────────
function createFakeFile(
  name = "report.pdf",
  type = "application/pdf",
  content = "fake-content",
) {
  return new File([content], name, { type });
}

// ─── Tests ──────────────────────────────────────────────────
describe("useUploadFile", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it("should expose initial state correctly", () => {
    const { result } = renderHook(() => useUploadFile(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.isUploading).toBe(false);
    expect(result.current.uploadError).toBeNull();
    expect(typeof result.current.uploadFile).toBe("function");
    expect(typeof result.current.resetUpload).toBe("function");
  });

  it("should call api with correct parameters and return response", async () => {
    const mockResponse = {
      filename: "report.pdf",
      file_id: "file-123",
      status: "uploaded",
      conversation_id: "conv-1",
      message: "File uploaded successfully",
    };

    mockedApi.uploadFile.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUploadFile(), {
      wrapper: createWrapper(queryClient),
    });

    const file = createFakeFile("report.pdf");
    let response:
      | Awaited<ReturnType<typeof aiAssistantApi.uploadFile>>
      | undefined;

    await act(async () => {
      response = await result.current.uploadFile({
        conversationId: "conv-1",
        file,
      });
    });

    expect(mockedApi.uploadFile).toHaveBeenCalledTimes(1);
    expect(mockedApi.uploadFile).toHaveBeenCalledWith("conv-1", file);
    expect(response).toEqual(mockResponse);
    expect(result.current.isUploading).toBe(false);
    expect(result.current.uploadError).toBeNull();
  });

  it("should set isUploading to true while uploading", async () => {
    let resolveUpload: (value: unknown) => void;

    mockedApi.uploadFile.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpload = resolve;
        }),
    );

    const { result } = renderHook(() => useUploadFile(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.isUploading).toBe(false);

    let uploadPromise: Promise<unknown>;

    act(() => {
      uploadPromise = result.current.uploadFile({
        conversationId: "conv-1",
        file: createFakeFile(),
      });
    });

    await waitFor(() => {
      expect(result.current.isUploading).toBe(true);
    });

    await act(async () => {
      resolveUpload!({ filename: "report.pdf" });
      await uploadPromise;
    });

    await waitFor(() => expect(result.current.isUploading).toBe(false));
  });

  it("should set uploadError when API fails", async () => {
    const error = new Error("Upload failed: file too large");
    mockedApi.uploadFile.mockRejectedValue(error);

    const { result } = renderHook(() => useUploadFile(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      try {
        await result.current.uploadFile({
          conversationId: "conv-1",
          file: createFakeFile("big-file.pdf"),
        });
      } catch {
        // expected
      }
    });

    expect(result.current.isUploading).toBe(false);
    await waitFor(() => expect(result.current.uploadError).toBe(error));
  });

  it("should allow resetting the error state", async () => {
    const error = new Error("Network error");
    mockedApi.uploadFile.mockRejectedValue(error);

    const { result } = renderHook(() => useUploadFile(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      try {
        await result.current.uploadFile({
          conversationId: "conv-1",
          file: createFakeFile(),
        });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.uploadError).toBe(error));

    act(() => {
      result.current.resetUpload();
    });

    await waitFor(() => {
      expect(result.current.uploadError).toBeNull();
      expect(result.current.isUploading).toBe(false);
    });
  });

  it("should handle multiple sequential uploads", async () => {
    mockedApi.uploadFile
      .mockResolvedValueOnce({
        filename: "file1.pdf",
        conversation_id: "",
        message: ""
      })
      .mockResolvedValueOnce({
        filename: "file2.docx",
        conversation_id: "",
        message: ""
      });

    const { result } = renderHook(() => useUploadFile(), {
      wrapper: createWrapper(queryClient),
    });

    let firstResponse: { filename: string } | undefined;
    let secondResponse: { filename: string } | undefined;

    await act(async () => {
      firstResponse = await result.current.uploadFile({
        conversationId: "conv-1",
        file: createFakeFile("file1.pdf"),
      });
    });

    await act(async () => {
      secondResponse = await result.current.uploadFile({
        conversationId: "conv-1",
        file: createFakeFile(
          "file2.docx",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ),
      });
    });

    expect(firstResponse?.filename).toBe("file1.pdf");
    expect(secondResponse?.filename).toBe("file2.docx");
    expect(mockedApi.uploadFile).toHaveBeenCalledTimes(2);
    expect(result.current.uploadError).toBeNull();
  });

  it("should reject with the same error that API throws", async () => {
    const error = new Error("Unsupported file type");
    mockedApi.uploadFile.mockRejectedValue(error);

    const { result } = renderHook(() => useUploadFile(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      result.current.uploadFile({
        conversationId: "conv-1",
        file: createFakeFile("image.png", "image/png"),
      }),
    ).rejects.toThrow("Unsupported file type");
  });
});
