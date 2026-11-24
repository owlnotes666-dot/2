import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseQueryMock } from "@/tests/utils/supabase-query-mock";

const createClientMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/client", () => ({ createClient: createClientMock }));

const supabase = createSupabaseQueryMock();
let service: (typeof import("@/features/appointments/api/appointment.service"))["appointmentService"];

beforeEach(async () => {
  vi.clearAllMocks();
  supabase.setResults({ data: [], error: null });
  createClientMock.mockReturnValue(supabase.client);
  service = (await import("@/features/appointments/api/appointment.service")).appointmentService;
});

describe("appointmentService", () => {
  it("loads active patients and doctors for appointment forms", async () => {
    const patients = [{ id: "p-1", full_name: "Patient" }];
    const doctors = [{ id: "d-1", full_name: "Doctor" }];
    supabase.setResults({ data: patients, error: null }, { data: doctors, error: null });

    await expect(service.getFormOptions()).resolves.toEqual({ patients, doctors });
    expect(supabase.from).toHaveBeenNthCalledWith(1, "patients");
    expect(supabase.from).toHaveBeenNthCalledWith(2, "doctors");
  });

  it("filters appointment results by related patient and doctor names", async () => {
    const rows = [
      { id: "a-1", patients: { full_name: "Maria Jones" }, doctors: { full_name: "Alex Smith" } },
      { id: "a-2", patients: { full_name: "John Doe" }, doctors: { full_name: "Maria Lee" } },
      { id: "a-3", patients: { full_name: "Other" }, doctors: { full_name: "Other" } },
    ];
    supabase.setResults({ data: rows, error: null });

    await expect(service.getAppointments({ search: " maria " })).resolves.toEqual(rows.slice(0, 2));
  });

  it("returns an appointment by id and throws query errors", async () => {
    const appointment = { id: "a-1" };
    supabase.setResults({ data: appointment, error: null });
    await expect(service.getAppointmentById("a-1")).resolves.toEqual(appointment);

    const error = new Error("not found");
    supabase.setResults({ data: null, error });
    await expect(service.getAppointments()).rejects.toBe(error);
  });

  it("aggregates appointment stats and propagates errors", async () => {
    supabase.setResults(
      { count: 10, error: null },
      { count: 2, error: null },
      { count: 3, error: null },
      { count: 1, error: null },
      { count: 4, error: null },
      { count: 0, error: null },
    );
    await expect(service.getAppointmentStats()).resolves.toEqual({
      total: 10, today: 2, scheduled: 3, confirmed: 1, completed: 4, cancelled: 0,
    });

    const error = new Error("stats unavailable");
    supabase.setResults({ count: null, error }, ...Array.from({ length: 5 }, () => ({ count: 0, error: null })));
    await expect(service.getAppointmentStats()).rejects.toBe(error);
  });

  it("creates, updates, and cancels appointments", async () => {
    const appointment = { id: "a-1", status: "Scheduled" };
    supabase.setResults({ data: appointment, error: null });
    await expect(service.createAppointment({ patient_id: "p-1" } as never)).resolves.toEqual(appointment);

    supabase.setResults({ data: appointment, error: null });
    await expect(service.updateAppointment({ id: "a-1", status: "Confirmed" } as never)).resolves.toEqual(appointment);

    supabase.setResults({ data: null, error: null });
    await expect(service.cancelAppointment("a-1")).resolves.toBeUndefined();
  });
});
