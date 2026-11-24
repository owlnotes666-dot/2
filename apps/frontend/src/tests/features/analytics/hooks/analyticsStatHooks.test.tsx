import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { wrapper } from "@/tests/utils/query-client-wrapper";

const api = vi.hoisted(() => ({
  getPatientMonthlyStats: vi.fn(),
  getAppointmentStatusStats: vi.fn(),
  getMedicalRecordStatusStats: vi.fn(),
}));

vi.mock("@/features/analytics/api", () => ({
  analyticsService: { getPatientMonthlyStats: api.getPatientMonthlyStats },
}));
vi.mock("@/features/analytics/api/analytics.service", () => api);

import { usePatientMonthlyStats } from "@/features/analytics/hooks/usePatientMonthlyStats";
import { useAppointmentStatusStats } from "@/features/analytics/hooks/useAppointmentStatusStats";
import { useMedicalRecordStatusStats } from "@/features/analytics/hooks/useMedicalRecordStatusStats";

describe("analytics statistic hooks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads patient monthly data for the requested range", async () => {
    const range = { period: "30d" as const, startDate: "2026-01-01", endDate: "2026-01-31" };
    const stats = [{ month: "Jan 2026", total: 4 }];
    api.getPatientMonthlyStats.mockResolvedValue(stats);
    const { result } = renderHook(() => usePatientMonthlyStats(range), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(stats));
    expect(api.getPatientMonthlyStats).toHaveBeenCalledWith(range);
  });

  it("loads appointment and medical-record status summaries", async () => {
    const range = { period: "7d" as const, startDate: "2026-01-01", endDate: "2026-01-07" };
    const appointments = [{ status: "Scheduled", total: 2 }];
    const records = [{ status: "Pending", total: 1 }];
    api.getAppointmentStatusStats.mockResolvedValue(appointments);
    api.getMedicalRecordStatusStats.mockResolvedValue(records);
    const appointmentHook = renderHook(() => useAppointmentStatusStats(range), { wrapper });
    const recordHook = renderHook(() => useMedicalRecordStatusStats(range), { wrapper });

    await waitFor(() => {
      expect(appointmentHook.result.current.data).toEqual(appointments);
      expect(recordHook.result.current.data).toEqual(records);
    });
    expect(api.getAppointmentStatusStats).toHaveBeenCalledWith(range);
    expect(api.getMedicalRecordStatusStats).toHaveBeenCalledWith(range);
  });
});
