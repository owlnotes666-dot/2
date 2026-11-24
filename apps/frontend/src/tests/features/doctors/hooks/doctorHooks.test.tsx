import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestQueryClient } from "@/tests/utils/query-client-wrapper";

const { getDoctors, createDoctor, updateDoctor, updateDoctorStatus } = vi.hoisted(
  () => ({
    getDoctors: vi.fn(),
    createDoctor: vi.fn(),
    updateDoctor: vi.fn(),
    updateDoctorStatus: vi.fn(),
  }),
);

vi.mock("@/features/doctors/api/doctorService", () => ({
  getDoctors,
  createDoctor,
  updateDoctor,
  updateDoctorStatus,
}));

import { useCreateDoctor } from "@/features/doctors/hooks/useCreateDoctor";
import { useDoctors } from "@/features/doctors/hooks/useDoctors";
import { useUpdateDoctor } from "@/features/doctors/hooks/useUpdateDoctor";
import { useUpdateDoctorStatus } from "@/features/doctors/hooks/useUpdateDoctorStatus";

describe("doctor hooks", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let wrapper: ({ children }: PropsWithChildren) => React.JSX.Element;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  });

  it("loads doctors", async () => {
    const doctors = [{ id: "d-1", full_name: "Doctor One" }];
    getDoctors.mockResolvedValue(doctors);
    const { result } = renderHook(() => useDoctors(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(doctors));
    expect(getDoctors).toHaveBeenCalledOnce();
  });

  it.each([
    ["create", useCreateDoctor, createDoctor, { full_name: "New Doctor" }],
    ["update", useUpdateDoctor, updateDoctor, { id: "d-1", full_name: "Updated" }],
    ["status update", useUpdateDoctorStatus, updateDoctorStatus, { id: "d-1", status: "Inactive" }],
  ] as const)("runs the %s mutation and invalidates doctors", async (serviceName, hook, service, input) => {
    service.mockResolvedValue({ id: "d-1" });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => hook(), { wrapper });

    await act(async () => result.current.mutateAsync(input as never));

    if (serviceName === "status update") {
      expect(service.mock.calls[0]).toEqual([input.id, input.status]);
    } else {
      expect(service.mock.calls[0][0]).toEqual(input);
    }
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["doctors", "list"] });
  });
});
