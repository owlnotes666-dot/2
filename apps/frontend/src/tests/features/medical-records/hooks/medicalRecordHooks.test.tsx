import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestQueryClient } from "@/tests/utils/query-client-wrapper";

const api = vi.hoisted(() => ({
  getMedicalRecords: vi.fn(),
  getMedicalRecordDetails: vi.fn(),
  createMedicalRecord: vi.fn(),
  updateMedicalRecordStatus: vi.fn(),
}));

vi.mock("@/features/medical-records/api/medicalRecordService", () => api);

import { useCreateMedicalRecord } from "@/features/medical-records/hooks/useCreateMedicalRecord";
import { useMedicalRecordDetails } from "@/features/medical-records/hooks/useMedicalRecordDetails";
import { useMedicalRecordFilters } from "@/features/medical-records/hooks/useMedicalRecordFilters";
import { useMedicalRecords } from "@/features/medical-records/hooks/useMedicalRecords";
import { useUpdateMedicalRecordStatus } from "@/features/medical-records/hooks/useUpdateMedicalRecordStatus";

describe("medical record hooks", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let wrapper: ({ children }: PropsWithChildren) => React.JSX.Element;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  });

  it("loads records and record details only when an id is present", async () => {
    const records = [{ id: "r-1" }];
    const details = { record: { id: "r-1" }, statusHistory: [] };
    api.getMedicalRecords.mockResolvedValue(records);
    api.getMedicalRecordDetails.mockResolvedValue(details);

    const list = renderHook(() => useMedicalRecords(), { wrapper });
    const disabled = renderHook(() => useMedicalRecordDetails(null), { wrapper });
    expect(disabled.result.current.fetchStatus).toBe("idle");
    const detail = renderHook(() => useMedicalRecordDetails("r-1"), { wrapper });

    await waitFor(() => {
      expect(list.result.current.data).toEqual(records);
      expect(detail.result.current.data).toEqual(details);
    });
    expect(api.getMedicalRecordDetails).toHaveBeenCalledWith("r-1");
  });

  it("creates a record and invalidates record queries", async () => {
    const input = { title: "Visit summary" };
    api.createMedicalRecord.mockResolvedValue({ id: "r-2" });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateMedicalRecord(), { wrapper });

    await act(async () => result.current.mutateAsync(input as never));

    expect(api.createMedicalRecord).toHaveBeenCalledWith(input);
    expect(invalidate).toHaveBeenCalledWith(expect.objectContaining({
      queryKey: expect.arrayContaining(["medicalRecords"]),
    }));
  });

  it("updates record status and invalidates both list and detail", async () => {
    const input = { id: "r-1", status: "Reviewed" };
    api.updateMedicalRecordStatus.mockResolvedValue({ id: "r-1" });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUpdateMedicalRecordStatus(), { wrapper });

    await act(async () => result.current.mutateAsync(input as never));

    expect(api.updateMedicalRecordStatus).toHaveBeenCalledWith(input);
    expect(invalidate).toHaveBeenCalledWith(expect.objectContaining({
      queryKey: expect.arrayContaining(["medicalRecords"]),
    }));
    expect(invalidate).toHaveBeenCalledWith(expect.objectContaining({
      queryKey: expect.arrayContaining(["medicalRecords", "detail", "r-1"]),
    }));
  });

  it("filters by normalized text, status, patient, and doctor and can clear filters", () => {
    const records = [
      { id: "r-1", title: "Annual checkup", status: "Pending", patient_id: "p-1", doctor_id: "d-1", patient: { full_name: "Alex Doe" }, doctor: { full_name: "Sam Lee" } },
      { id: "r-2", title: "X-ray", status: "Reviewed", patient_id: "p-2", doctor_id: "d-2", patient: { full_name: "Taylor" }, doctor: { full_name: "Morgan" } },
    ];
    const { result } = renderHook(() => useMedicalRecordFilters(records as never));

    act(() => {
      result.current.setSearch("  ALEX ");
      result.current.setStatus("Pending");
      result.current.setPatientId("p-1");
      result.current.setDoctorId("d-1");
    });
    expect(result.current.filteredRecords).toEqual([records[0]]);
    expect(result.current.hasActiveFilters).toBe(true);

    act(() => result.current.clearFilters());
    expect(result.current.filteredRecords).toEqual(records);
    expect(result.current.hasActiveFilters).toBe(false);
  });
});
