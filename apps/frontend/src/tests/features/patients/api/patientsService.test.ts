import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseQueryMock } from "@/tests/utils/supabase-query-mock";

const createClientMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/client", () => ({ createClient: createClientMock }));

const supabase = createSupabaseQueryMock();
let service: (typeof import("@/features/patients/api/patients.service"))["patientsService"];

beforeEach(async () => {
  vi.clearAllMocks();
  supabase.setResults({ data: [], error: null });
  createClientMock.mockReturnValue(supabase.client);
  service = (await import("@/features/patients/api/patients.service")).patientsService;
});

describe("patientsService", () => {
  it("lists patients and returns an empty list for null data", async () => {
    supabase.setResults({ data: null, error: null });
    await expect(service.getPatients()).resolves.toEqual([]);
    expect(supabase.from).toHaveBeenCalledWith("patients");
  });

  it("creates and updates patients with the supplied payload", async () => {
    const patient = { id: "p-1", full_name: "Patient" };
    const payload = { full_name: "Patient" };
    supabase.setResults({ data: patient, error: null });
    await expect(service.createPatient(payload as never)).resolves.toEqual(patient);

    supabase.setResults({ data: patient, error: null });
    await expect(service.updatePatient({ id: "p-1", ...payload } as never)).resolves.toEqual(patient);
    expect(supabase.from).toHaveBeenCalledWith("patients");
  });

  it("updates status and propagates database errors", async () => {
    const patient = { id: "p-1", status: "Inactive" };
    supabase.setResults({ data: patient, error: null });
    await expect(service.updatePatientStatus({ id: "p-1", status: "Inactive" } as never)).resolves.toEqual(patient);

    const error = new Error("database error");
    supabase.setResults({ data: null, error });
    await expect(service.getPatients()).rejects.toBe(error);
  });
});
