import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { wrapper } from "@/tests/utils/query-client-wrapper";

const {
  mockGetStats,
  mockAppointments,
  mockGetTodayAppointments,
  mockGetOperationsInsights,
} = vi.hoisted(() => ({
  mockGetStats: vi.fn(),
  mockAppointments: vi.fn(),
  mockGetTodayAppointments: vi.fn(),
  mockGetOperationsInsights: vi.fn(),
}));

vi.mock("@/features/dashboard/api", () => ({
  dashboardService: {
    getStats: mockGetStats,
    appointments: mockAppointments,
    getTodayAppointments: mockGetTodayAppointments,
    getOperationsInsights: mockGetOperationsInsights,
  },
}));

import {
  useDashboardStats,
  useAppointments,
  useTodayAppointments,
  useOperationsInsights,
} from "@/features/dashboard/hooks";

describe("Dashboard hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch dashboard stats", async () => {
    const data = {
      totalPatients: 120,
      appointmentsToday: 8,
      activeDoctors: 5,
      pendingReports: 3,
    };

    mockGetStats.mockResolvedValue(data);

    const { result } = renderHook(() => useDashboardStats(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockGetStats).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(data);
  });

  it("should fetch monthly appointments", async () => {
    const data = [
      {
        id: "1",
        month: "Jan",
        appointments: 20,
      },
    ];

    mockAppointments.mockResolvedValue(data);

    const { result } = renderHook(() => useAppointments(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockAppointments).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(data);
  });

  it("should fetch today's appointments", async () => {
    const data = [
      {
        id: "appointment-1",
        status: "Scheduled",
      },
    ];

    mockGetTodayAppointments.mockResolvedValue(data);

    const { result } = renderHook(() => useTodayAppointments(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockGetTodayAppointments).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(data);
  });

  it("should fetch operations insights", async () => {
    const data = {
      appointmentDistribution: [],
      departmentActivity: [],
      operationalAlerts: [],
    };

    mockGetOperationsInsights.mockResolvedValue(data);

    const { result } = renderHook(() => useOperationsInsights(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockGetOperationsInsights).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(data);
  });

  it("should handle dashboard stats errors", async () => {
    const error = new Error("Failed to fetch dashboard stats");

    mockGetStats.mockRejectedValue(error);

    const { result } = renderHook(() => useDashboardStats(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});