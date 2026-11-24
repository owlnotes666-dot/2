
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createClient } from "@/lib/supabase/client";
import { AnalyticsDateRange, analyticsService, getAppointmentStatusStats, getMedicalRecordStatusStats } from "@/features/analytics";


// ─── Mock Supabase Client ───────────────────────────────────
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

const mockedCreateClient = vi.mocked(createClient);

// ─── Helpers to build a chainable Supabase mock ─────────────
type MockResult = {
  data?: unknown;
  count?: number | null;
  error?: { message: string; code?: string } | null;
};

function createQueryBuilder(
  result: MockResult = { data: [], count: 0, error: null },
) {
  const builder: Record<string, unknown> = {};

  const chainMethods = [
    "select",
    "gte",
    "lte",
    "eq",
    "order",
    "from",
    "schema",
  ];

  chainMethods.forEach((method) => {
    builder[method] = vi.fn().mockReturnValue(builder);
  });


  builder.then = (onFulfilled: (value: MockResult) => unknown) =>
    Promise.resolve(result).then(onFulfilled);


  Object.defineProperty(builder, "then", {
    value: (
      onFulfilled: (value: MockResult) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(onFulfilled, onRejected),
  });

  return builder;
}

function createSupabaseMock(results: MockResult | MockResult[]) {
  const resultsArray = Array.isArray(results) ? results : [results];
  let callIndex = 0;

  const schemaMock = vi.fn().mockImplementation(() => {
    const fromMock = vi.fn().mockImplementation(() => {
      const currentResult = resultsArray[callIndex] ?? {
        data: [],
        count: 0,
        error: null,
      };
      callIndex += 1;
      return createQueryBuilder(currentResult);
    });

    return { from: fromMock };
  });

  return {
    schema: schemaMock,
  };
}

// ─── Test Data ──────────────────────────────────────────────
const dateRange: AnalyticsDateRange = {
    startDate: "2025-01-01T12:00:00.000Z",
    endDate: "2025-03-31T12:00:00.000Z",
    period: "7d"
};

// ─── Tests ──────────────────────────────────────────────────
describe("analyticsService.getAnalyticsStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return correct stats when all queries succeed", async () => {
    const mockResults: MockResult[] = [
      { count: 120, error: null }, // patients
      { count: 15, error: null }, // doctors
      { count: 340, error: null }, // appointments
      { count: 89, error: null }, // medicalRecords
      { count: 12, error: null }, // activeDoctors
      { count: 45, error: null }, // scheduledAppointments
      { count: 7, error: null }, // pendingMedicalRecords
    ];

    mockedCreateClient.mockReturnValue(
      createSupabaseMock(mockResults) as never,
    );

    const result = await analyticsService.getAnalyticsStats(dateRange);

    expect(result).toEqual({
      totalPatients: 120,
      totalDoctors: 15,
      totalAppointments: 340,
      totalMedicalRecords: 89,
      activeDoctors: 12,
      scheduledAppointments: 45,
      pendingMedicalRecords: 7,
    });
  });

  it("should return 0 when count is null", async () => {
    const mockResults: MockResult[] = Array(7).fill({
      count: null,
      error: null,
    });

    mockedCreateClient.mockReturnValue(
      createSupabaseMock(mockResults) as never,
    );

    const result = await analyticsService.getAnalyticsStats(dateRange);

    expect(result).toEqual({
      totalPatients: 0,
      totalDoctors: 0,
      totalAppointments: 0,
      totalMedicalRecords: 0,
      activeDoctors: 0,
      scheduledAppointments: 0,
      pendingMedicalRecords: 0,
    });
  });

  it("should throw when any query returns an error", async () => {
    const mockResults: MockResult[] = [
      { count: 10, error: null },
      { count: 5, error: null },
      {
        count: null,
        error: { message: "permission denied", code: "42501" },
      },
      { count: 0, error: null },
      { count: 0, error: null },
      { count: 0, error: null },
      { count: 0, error: null },
    ];

    mockedCreateClient.mockReturnValue(
      createSupabaseMock(mockResults) as never,
    );

    await expect(analyticsService.getAnalyticsStats(dateRange)).rejects.toEqual(
      expect.objectContaining({ message: "permission denied" }),
    );
  });
});

describe("analyticsService.getPatientMonthlyStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should group patients by month correctly", async () => {
    const patientsData = [
      { created_at: "2025-01-05T10:00:00Z" },
      { created_at: "2025-01-20T12:00:00Z" },
      { created_at: "2025-02-03T09:00:00Z" },
      { created_at: "2025-03-15T14:00:00Z" },
      { created_at: "2025-03-28T16:00:00Z" },
      { created_at: "2025-03-30T11:00:00Z" },
    ];

    mockedCreateClient.mockReturnValue(
      createSupabaseMock({ data: patientsData, error: null }) as never,
    );

    const result = await analyticsService.getPatientMonthlyStats(dateRange);

    expect(result).toEqual([
      { month: "Jan 2025", total: 2 },
      { month: "Feb 2025", total: 1 },
      { month: "Mar 2025", total: 3 },
    ]);
  });

  it("should return months with zero count when no patients exist in that month", async () => {
    const patientsData = [
      { created_at: "2025-01-10T10:00:00Z" },
      // فوریه خالی
      { created_at: "2025-03-05T10:00:00Z" },
    ];

    mockedCreateClient.mockReturnValue(
      createSupabaseMock({ data: patientsData, error: null }) as never,
    );

    const result = await analyticsService.getPatientMonthlyStats(dateRange);

    expect(result).toEqual([
      { month: "Jan 2025", total: 1 },
      { month: "Feb 2025", total: 0 },
      { month: "Mar 2025", total: 1 },
    ]);
  });

  it("should return empty array of months with zeros when data is empty", async () => {
    mockedCreateClient.mockReturnValue(
      createSupabaseMock({ data: [], error: null }) as never,
    );

    const result = await analyticsService.getPatientMonthlyStats(dateRange);

    expect(result).toEqual([
      { month: "Jan 2025", total: 0 },
      { month: "Feb 2025", total: 0 },
      { month: "Mar 2025", total: 0 },
    ]);
  });

  it("should throw when supabase returns an error", async () => {
    mockedCreateClient.mockReturnValue(
      createSupabaseMock({
        data: null,
        error: { message: "relation does not exist" },
      }) as never,
    );

    await expect(
      analyticsService.getPatientMonthlyStats(dateRange),
    ).rejects.toEqual(
      expect.objectContaining({ message: "relation does not exist" }),
    );
  });
});

describe("getAppointmentStatusStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should count appointments by status", async () => {
    const appointmentsData = [
      { status: "Scheduled" },
      { status: "Scheduled" },
      { status: "Completed" },
      { status: "Cancelled" },
      { status: "Completed" },
      { status: "Completed" },
    ];

    mockedCreateClient.mockReturnValue(
      createSupabaseMock({ data: appointmentsData, error: null }) as never,
    );

    const result = await getAppointmentStatusStats(dateRange);

    expect(result).toEqual([
      { status: "Scheduled", total: 2 },
      { status: "Completed", total: 3 },
      { status: "Cancelled", total: 1 },
    ]);
  });

  it("should return zero for statuses with no appointments", async () => {
    mockedCreateClient.mockReturnValue(
      createSupabaseMock({
        data: [{ status: "Completed" }],
        error: null,
      }) as never,
    );

    const result = await getAppointmentStatusStats(dateRange);

    expect(result).toEqual([
      { status: "Scheduled", total: 0 },
      { status: "Completed", total: 1 },
      { status: "Cancelled", total: 0 },
    ]);
  });

  it("should handle empty data", async () => {
    mockedCreateClient.mockReturnValue(
      createSupabaseMock({ data: [], error: null }) as never,
    );

    const result = await getAppointmentStatusStats(dateRange);

    expect(result).toEqual([
      { status: "Scheduled", total: 0 },
      { status: "Completed", total: 0 },
      { status: "Cancelled", total: 0 },
    ]);
  });

  it("should throw on supabase error", async () => {
    mockedCreateClient.mockReturnValue(
      createSupabaseMock({
        data: null,
        error: { message: "timeout" },
      }) as never,
    );

    await expect(getAppointmentStatusStats(dateRange)).rejects.toEqual(
      expect.objectContaining({ message: "timeout" }),
    );
  });
});

describe("getMedicalRecordStatusStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should count medical records by status", async () => {
    const recordsData = [
      { status: "Pending" },
      { status: "Pending" },
      { status: "Reviewed" },
      { status: "Completed" },
      { status: "Completed" },
      { status: "Completed" },
    ];

    mockedCreateClient.mockReturnValue(
      createSupabaseMock({ data: recordsData, error: null }) as never,
    );

    const result = await getMedicalRecordStatusStats(dateRange);

    expect(result).toEqual([
      { status: "Pending", total: 2 },
      { status: "Reviewed", total: 1 },
      { status: "Completed", total: 3 },
    ]);
  });

  it("should return zeros when no records match", async () => {
    mockedCreateClient.mockReturnValue(
      createSupabaseMock({ data: [], error: null }) as never,
    );

    const result = await getMedicalRecordStatusStats(dateRange);

    expect(result).toEqual([
      { status: "Pending", total: 0 },
      { status: "Reviewed", total: 0 },
      { status: "Completed", total: 0 },
    ]);
  });

  it("should throw on supabase error", async () => {
    mockedCreateClient.mockReturnValue(
      createSupabaseMock({
        data: null,
        error: { message: "JWT expired" },
      }) as never,
    );

    await expect(getMedicalRecordStatusStats(dateRange)).rejects.toEqual(
      expect.objectContaining({ message: "JWT expired" }),
    );
  });
});
