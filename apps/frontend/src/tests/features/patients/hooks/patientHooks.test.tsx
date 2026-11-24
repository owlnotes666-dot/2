import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestQueryClient } from "@/tests/utils/query-client-wrapper";

const { getPatients, createPatient, updatePatient, updatePatientStatus } =
  vi.hoisted(() => ({
    getPatients: vi.fn(),
    createPatient: vi.fn(),
    updatePatient: vi.fn(),
    updatePatientStatus: vi.fn(),
  }));

vi.mock("@/features/patients/api/patients.service", () => ({
  patientsService: { getPatients, createPatient, updatePatient, updatePatientStatus },
}));

import {
  useCreatePatient,
  usePatients,
  useUpdatePatient,
  useUpdatePatientStatus,
} from "@/features/patients/hooks";

describe("patient hooks", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let wrapper: ({ children }: PropsWithChildren) => React.JSX.Element;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  });

  it("loads patients and reports query errors", async () => {
    const patients = [{ id: "p-1", full_name: "Patient One" }];
    getPatients.mockResolvedValueOnce(patients);
    const { result, rerender } = renderHook(() => usePatients(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(patients));
    expect(getPatients).toHaveBeenCalledOnce();

    rerender();
    queryClient.clear();
    getPatients.mockRejectedValueOnce(new Error("network"));
    const failed = renderHook(() => usePatients(), { wrapper });
    await waitFor(() => expect(failed.result.current.isError).toBe(true));
  });

  it("creates a patient and invalidates the patient list", async () => {
    const payload = { full_name: "New Patient" };
    const patient = { id: "p-2", ...payload };
    createPatient.mockResolvedValue(patient);
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreatePatient(), { wrapper });

    await act(async () => expect(await result.current.mutateAsync(payload as never)).toEqual(patient));

    expect(createPatient).toHaveBeenCalledWith(payload);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["patients"] });
  });

  it("updates a patient and invalidates the patient list", async () => {
    const payload = { id: "p-1", full_name: "Updated" };
    updatePatient.mockResolvedValue(payload);
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUpdatePatient(), { wrapper });

    await act(async () => result.current.mutateAsync(payload as never));

    expect(updatePatient.mock.calls[0][0]).toEqual(payload);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["patients"] });
  });

  it("updates patient status and invalidates the patient list", async () => {
    const payload = { id: "p-1", status: "Inactive" };
    updatePatientStatus.mockResolvedValue(payload);
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUpdatePatientStatus(), { wrapper });

    await act(async () => result.current.mutateAsync(payload as never));

    expect(updatePatientStatus.mock.calls[0][0]).toEqual(payload);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["patients"] });
  });
});
