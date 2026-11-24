import { dashboardService } from "@/features/dashboard";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFrom = vi.hoisted(() => vi.fn());
const mockSchema = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    schema: mockSchema,
  }),
}));

let queryResults: Array<{
  data?: unknown;
  error: Error | null;
  count?: number | null;
}> = [];

beforeEach(() => {
  vi.clearAllMocks();
  queryResults = [];

  mockSchema.mockReturnValue({
    from: mockFrom,
  });

  mockFrom.mockImplementation(() => {
    const result = queryResults.shift() ?? {
      data: [],
      error: null,
      count: 0,
    };

    const query: unknown = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      gte: vi.fn(() => query),
      lt: vi.fn(() => query),
      order: vi.fn(() => query),
      maybeSingle: vi.fn(async () => result),
      single: vi.fn(async () => result),
      then: (resolve: (value: typeof result) => unknown) =>
        Promise.resolve(result).then(resolve),
    };

    return query;
  });
});

describe("dashboardService", () => {
  it("should get dashboard stats", async () => {
    queryResults = [
      { count: 120, error: null },
      { count: 20, error: null },
      { count: 10, error: null },
      { count: 8, error: null },
      { count: 4, error: null },
      { count: 5, error: null },
      { count: 3, error: null },
      {
        data: { active_doctors: 5, pending_reports: 3 },
        error: null,
      },
      {
        data: { active_doctors: 4, pending_reports: 6 },
        error: null,
      },
    ];

    const result = await dashboardService.getStats();

    expect(mockSchema).toHaveBeenCalledWith("medical");
    expect(mockFrom).toHaveBeenCalledTimes(9);

    expect(result).toEqual(
      expect.objectContaining({
        totalPatients: 120,
        patientsGrowth: 100,
        appointmentsToday: 8,
        appointmentsGrowth: 100,
        activeDoctors: 5,
        doctorsGrowth: 25,
        pendingReports: 3,
        reportsGrowth: -50,
      }),
    );
  });

  it("should throw when dashboard stats query fails", async () => {
    const error = new Error("Database error");

    queryResults = [
      { count: null, error },
      ...Array.from({ length: 8 }, () => ({
        count: 0,
        data: null,
        error: null,
      })),
    ];

    await expect(dashboardService.getStats()).rejects.toThrow("Database error");
  });

  it("should return monthly appointment counts", async () => {
    queryResults = [
      {
        data: [
          { appointment_date: `${new Date().getFullYear()}-01-10` },
          { appointment_date: `${new Date().getFullYear()}-01-15` },
          { appointment_date: `${new Date().getFullYear()}-02-12` },
        ],
        error: null,
      },
    ];

    const result = await dashboardService.appointments();

    expect(mockSchema).toHaveBeenCalledWith("medical");
    expect(mockFrom).toHaveBeenCalledWith("appointments");
    expect(result).toHaveLength(12);
    expect(result[0].appointments).toBe(2);
    expect(result[1].appointments).toBe(1);
  });

  it("should throw when fetching appointments fails", async () => {
    queryResults = [
      {
        data: null,
        error: new Error("Appointments error"),
      },
    ];

    await expect(dashboardService.appointments()).rejects.toThrow(
      "Appointments error",
    );
  });

  it("should get today's appointments", async () => {
    const appointments = [
      {
        id: "appointment-1",
        status: "Scheduled",
        appointment_time: "09:00",
      },
    ];

    queryResults = [
      {
        data: appointments,
        error: null,
      },
    ];

    const result = await dashboardService.getTodayAppointments();

    expect(mockFrom).toHaveBeenCalledWith("appointments");
    expect(result).toEqual(appointments);
  });

  it("should throw when today's appointments query fails", async () => {
    queryResults = [
      {
        data: null,
        error: new Error("Today's appointments error"),
      },
    ];

    await expect(dashboardService.getTodayAppointments()).rejects.toThrow(
      "Today's appointments error",
    );
  });

  it("should calculate operations insights", async () => {
    queryResults = [
      {
        data: [
          { status: "Completed" },
          { status: "Completed" },
          { status: "Pending" },
        ],
        error: null,
      },
      {
        data: [
          {
            specialty: "Cardiology",
            appointments: [{ id: "1" }, { id: "2" }],
          },
          {
            specialty: "Cardiology",
            appointments: [{ id: "3" }],
          },
          {
            specialty: "Neurology",
            appointments: [{ id: "4" }],
          },
        ],
        error: null,
      },
      {
        data: [
          {
            id: "record-1",
            title: "Blood Test",
            created_at: "2026-11-17T10:00:00.000Z",
            patients: { full_name: "Demo Patient" },
          },
        ],
        error: null,
      },
    ];

    const result = await dashboardService.getOperationsInsights();

    expect(result.appointmentDistribution).toEqual(
      expect.arrayContaining([
        { status: "Completed", count: 2 },
        { status: "Pending", count: 1 },
      ]),
    );

    expect(result.departmentActivity).toEqual(
      expect.arrayContaining([
        { specialty: "Cardiology", appointments: 3 },
        { specialty: "Neurology", appointments: 1 },
      ]),
    );

    expect(result.operationalAlerts).toEqual([
      {
        id: "record-1",
        title: "Blood Test",
        patientName: "Demo Patient",
        createdAt: "2026-11-17T10:00:00.000Z",
        type: "Pending Medical Report",
      },
    ]);
  });

  it("should handle missing patient information in operational alerts", async () => {
    queryResults = [
      { data: [], error: null },
      { data: [], error: null },
      {
        data: [
          {
            id: "record-2",
            title: "Medical Report",
            created_at: "2026-11-17T10:00:00.000Z",
            patients: null,
          },
        ],
        error: null,
      },
    ];

    const result = await dashboardService.getOperationsInsights();

    expect(result.operationalAlerts[0].patientName).toBe("Unknown Patient");
  });

  it("should throw when operations insights query fails", async () => {
    queryResults = [
      {
        data: null,
        error: new Error("Insights error"),
      },
      { data: [], error: null },
      { data: [], error: null },
    ];

    await expect(dashboardService.getOperationsInsights()).rejects.toThrow(
      "Insights error",
    );
  });
});
