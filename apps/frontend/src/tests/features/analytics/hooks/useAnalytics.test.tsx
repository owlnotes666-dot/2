
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { analyticsService, AnalyticsDateRange, AnalyticsStats, useAnalytics } from "@/features/analytics";



// ─── Mock Service ───────────────────────────────────────────
vi.mock("@/features/analytics/api", () => ({
  analyticsService: {
    getAnalyticsStats: vi.fn(),
  },
}));

const mockedGetAnalyticsStats = vi.mocked(analyticsService.getAnalyticsStats);

// ─── Test Data ──────────────────────────────────────────────
const dateRange: AnalyticsDateRange = {
  startDate: "2025-01-01T00:00:00.000Z",
  endDate: "2025-03-31T23:59:59.999Z",
  period: "7d"
};

const mockStats: AnalyticsStats = {
  totalPatients: 120,
  totalDoctors: 15,
  totalAppointments: 340,
  totalMedicalRecords: 89,
  activeDoctors: 12,
  scheduledAppointments: 45,
  pendingMedicalRecords: 7,
};

// ─── Helpers ────────────────────────────────────────────────
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
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

// ─── Tests ──────────────────────────────────────────────────
describe("useAnalytics", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it("should start in loading state", () => {
    mockedGetAnalyticsStats.mockImplementation(
      () => new Promise(() => {}), // never resolves
    );

    const { result } = renderHook(() => useAnalytics(dateRange), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it("should return analytics stats on success", async () => {
    mockedGetAnalyticsStats.mockResolvedValue(mockStats);

    const { result } = renderHook(() => useAnalytics(dateRange), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockStats);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(mockedGetAnalyticsStats).toHaveBeenCalledTimes(1);
    expect(mockedGetAnalyticsStats).toHaveBeenCalledWith(dateRange);
  });

  it("should return error when service fails", async () => {
    const error = new Error("Failed to fetch analytics");
    mockedGetAnalyticsStats.mockRejectedValue(error);

    const { result } = renderHook(() => useAnalytics(dateRange), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBe(error);
    expect(result.current.isLoading).toBe(false);
  });

  it("should use the correct queryKey based on dateRange", async () => {
    mockedGetAnalyticsStats.mockResolvedValue(mockStats);

    renderHook(() => useAnalytics(dateRange), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(mockedGetAnalyticsStats).toHaveBeenCalled();
    });

    const queryState = queryClient.getQueryState([
      "analytics",
      "stats",
      dateRange.startDate,
      dateRange.endDate,
    ]);

    expect(queryState).toBeDefined();
    expect(queryState?.status).toBe("success");
  });

  it("should refetch when dateRange changes", async () => {
    mockedGetAnalyticsStats.mockResolvedValue(mockStats);

    const { result, rerender } = renderHook(
      ({ range }) => useAnalytics(range),
      {
        wrapper: createWrapper(queryClient),
        initialProps: { range: dateRange },
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedGetAnalyticsStats).toHaveBeenCalledTimes(1);

    const newDateRange: AnalyticsDateRange = {
      startDate: "2025-04-01T00:00:00.000Z",
      endDate: "2025-06-30T23:59:59.999Z",
      period: "7d"
    };

    const newStats: AnalyticsStats = {
      ...mockStats,
      totalPatients: 200,
    };

    mockedGetAnalyticsStats.mockResolvedValue(newStats);

    rerender({ range: newDateRange });

    await waitFor(() => {
      expect(result.current.data).toEqual(newStats);
    });

    expect(mockedGetAnalyticsStats).toHaveBeenCalledTimes(2);
    expect(mockedGetAnalyticsStats).toHaveBeenLastCalledWith(newDateRange);
  });

  it("should respect staleTime (not refetch immediately on remount)", async () => {
    mockedGetAnalyticsStats.mockResolvedValue(mockStats);

    const { result, unmount } = renderHook(() => useAnalytics(dateRange), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedGetAnalyticsStats).toHaveBeenCalledTimes(1);

    unmount();

    // remount with same dateRange → should use cache because of staleTime
    const { result: result2 } = renderHook(() => useAnalytics(dateRange), {
      wrapper: createWrapper(queryClient),
    });

    expect(result2.current.data).toEqual(mockStats);
    expect(result2.current.isLoading).toBe(false);

    expect(mockedGetAnalyticsStats).toHaveBeenCalledTimes(1);
  });
});