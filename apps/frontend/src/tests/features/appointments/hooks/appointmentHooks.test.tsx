import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestQueryClient } from "@/tests/utils/query-client-wrapper";

const { appointmentService } = vi.hoisted(() => ({
  appointmentService: {
    getFormOptions: vi.fn(),
    getAppointments: vi.fn(),
    getAppointmentStats: vi.fn(),
    getAppointmentById: vi.fn(),
    createAppointment: vi.fn(),
    updateAppointment: vi.fn(),
    cancelAppointment: vi.fn(),
  },
}));

vi.mock("@/features/appointments/api", () => ({ appointmentService }));
vi.mock("@/features/appointments/api/appointment.service", () => ({
  appointmentService,
}));

import { useAppointmentFormOptions } from "@/features/appointments/hooks/useAppointmentFormOptions";
import {
  useAppointment,
  useAppointmentStats,
  useAppointments,
  useCancelAppointment,
  useCreateAppointment,
  useUpdateAppointment,
} from "@/features/appointments/hooks/useAppointments";

describe("appointment hooks", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let wrapper: ({ children }: PropsWithChildren) => React.JSX.Element;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  });

  it("loads appointment list, stats, and form options", async () => {
    const appointments = [{ id: "a-1" }];
    const stats = { total: 1 };
    const formOptions = { patients: [], doctors: [] };
    appointmentService.getAppointments.mockResolvedValue(appointments);
    appointmentService.getAppointmentStats.mockResolvedValue(stats);
    appointmentService.getFormOptions.mockResolvedValue(formOptions);

    const list = renderHook(() => useAppointments({ status: "Scheduled" }), { wrapper });
    const statsHook = renderHook(() => useAppointmentStats(), { wrapper });
    const options = renderHook(() => useAppointmentFormOptions(), { wrapper });

    await waitFor(() => {
      expect(list.result.current.data).toEqual(appointments);
      expect(statsHook.result.current.data).toEqual(stats);
      expect(options.result.current.data).toEqual(formOptions);
    });
    expect(appointmentService.getAppointments).toHaveBeenCalledWith({ status: "Scheduled" });
    expect(appointmentService.getAppointmentStats).toHaveBeenCalledOnce();
    expect(appointmentService.getFormOptions).toHaveBeenCalledOnce();
  });

  it("loads a detail only when an id is provided", async () => {
    const appointment = { id: "a-1" };
    appointmentService.getAppointmentById.mockResolvedValue(appointment);
    const disabled = renderHook(() => useAppointment(""), { wrapper });
    expect(disabled.result.current.fetchStatus).toBe("idle");
    expect(appointmentService.getAppointmentById).not.toHaveBeenCalled();

    const enabled = renderHook(() => useAppointment("a-1"), { wrapper });
    await waitFor(() => expect(enabled.result.current.data).toEqual(appointment));
    expect(appointmentService.getAppointmentById).toHaveBeenCalledWith("a-1");
  });

  it.each([
    ["create", useCreateAppointment, "createAppointment", { patient_id: "p-1" }],
    ["update", useUpdateAppointment, "updateAppointment", { id: "a-1", status: "Confirmed" }],
    ["cancel", useCancelAppointment, "cancelAppointment", "a-1"],
  ] as const)("runs %s and invalidates appointment data", async (_name, hook, serviceName, input) => {
    const service = appointmentService[serviceName];
    service.mockResolvedValue({ id: "a-1" });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => hook(), { wrapper });

    await act(async () => result.current.mutateAsync(input as never));

    expect(service).toHaveBeenCalledWith(input);
    expect(invalidate).toHaveBeenCalledWith(expect.objectContaining({
      queryKey: expect.arrayContaining(["appointments"]),
    }));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["dashboard", "todayAppointments"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["dashboard", "appointments"] });
  });
});
