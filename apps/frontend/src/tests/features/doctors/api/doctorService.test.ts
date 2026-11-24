import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseQueryMock } from "@/tests/utils/supabase-query-mock";

const createClientMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/client", () => ({ createClient: createClientMock }));

const supabase = createSupabaseQueryMock();
let service: typeof import("@/features/doctors/api/doctorService");

beforeEach(async () => {
  vi.clearAllMocks();
  supabase.setResults({ data: [], error: null });
  createClientMock.mockReturnValue(supabase.client);
  service = await import("@/features/doctors/api/doctorService");
});

describe("doctorService", () => {
  it("lists doctors and defaults null query data to an empty list", async () => {
    supabase.setResults({ data: null, error: null });
    await expect(service.getDoctors()).resolves.toEqual([]);
    expect(supabase.from).toHaveBeenCalledWith("doctors");
  });

  it("creates, updates, and changes doctor status", async () => {
    const doctor = { id: "d-1", full_name: "Doctor" };
    supabase.setResults({ data: doctor, error: null });
    await expect(service.createDoctor({ full_name: "Doctor" } as never)).resolves.toEqual(doctor);

    supabase.setResults({ data: doctor, error: null });
    await expect(service.updateDoctor({ id: "d-1", full_name: "Doctor" } as never)).resolves.toEqual(doctor);

    supabase.setResults({ data: doctor, error: null });
    await expect(service.updateDoctorStatus("d-1", "Inactive")).resolves.toEqual(doctor);
    expect(supabase.from).toHaveBeenCalledWith("doctors");
  });

  it("propagates Supabase errors", async () => {
    const error = new Error("query failed");
    supabase.setResults({ data: null, error });
    await expect(service.getDoctors()).rejects.toBe(error);
  });
});
