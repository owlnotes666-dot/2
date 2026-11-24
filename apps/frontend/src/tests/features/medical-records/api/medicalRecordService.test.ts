import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseQueryMock } from "@/tests/utils/supabase-query-mock";

const createClientMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/client", () => ({ createClient: createClientMock }));

const supabase = createSupabaseQueryMock();
let service: typeof import("@/features/medical-records/api/medicalRecordService");

beforeEach(async () => {
  vi.clearAllMocks();
  supabase.setResults({ data: [], error: null });
  createClientMock.mockReturnValue(supabase.client);
  service = await import("@/features/medical-records/api/medicalRecordService");
});

describe("medicalRecordService", () => {
  it("lists records and returns empty results when data is null", async () => {
    supabase.setResults({ data: null, error: null });
    await expect(service.getMedicalRecords()).resolves.toEqual([]);
    expect(supabase.from).toHaveBeenCalledWith("medical_records");
  });

  it("creates a medical record and updates its status", async () => {
    const record = { id: "r-1", title: "Visit" };
    supabase.setResults({ data: record, error: null });
    await expect(service.createMedicalRecord({ title: "Visit" } as never)).resolves.toEqual(record);

    supabase.setResults({ data: { ...record, status: "Reviewed" }, error: null });
    await expect(service.updateMedicalRecordStatus({ id: "r-1", status: "Reviewed" } as never))
      .resolves.toEqual({ ...record, status: "Reviewed" });
  });

  it("loads record details with status history", async () => {
    const record = { id: "r-1", title: "Visit" };
    const history = [{ id: "h-1", new_status: "Reviewed" }];
    supabase.setResults({ data: record, error: null }, { data: history, error: null });

    await expect(service.getMedicalRecordDetails("r-1")).resolves.toEqual({
      record,
      statusHistory: history,
    });
  });

  it("propagates record and history query errors", async () => {
    const recordError = new Error("record unavailable");
    supabase.setResults({ data: null, error: recordError });
    await expect(service.getMedicalRecordDetails("r-1")).rejects.toBe(recordError);

    const historyError = new Error("history unavailable");
    supabase.setResults({ data: { id: "r-1" }, error: null }, { data: null, error: historyError });
    await expect(service.getMedicalRecordDetails("r-1")).rejects.toBe(historyError);
  });
});
