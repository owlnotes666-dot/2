import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestQueryClient } from "@/tests/utils/query-client-wrapper";

const { getStaff, createStaff, updateStaff, updateStaffStatus } = vi.hoisted(
  () => ({
    getStaff: vi.fn(),
    createStaff: vi.fn(),
    updateStaff: vi.fn(),
    updateStaffStatus: vi.fn(),
  }),
);

vi.mock("@/features/staff/api/staffService", () => ({
  getStaff,
  createStaff,
  updateStaff,
  updateStaffStatus,
}));

import { useCreateStaff } from "@/features/staff/hooks/useCreateStaff";
import { useStaff } from "@/features/staff/hooks/useStaff";
import { useUpdateStaff } from "@/features/staff/hooks/useUpdateStaff";
import { useUpdateStaffStatus } from "@/features/staff/hooks/useUpdateStaffStatus";

describe("staff hooks", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let wrapper: ({ children }: PropsWithChildren) => React.JSX.Element;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  });

  it("loads staff", async () => {
    const staff = [{ id: "s-1", full_name: "Staff One" }];
    getStaff.mockResolvedValue(staff);
    const { result } = renderHook(() => useStaff(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(staff));
    expect(getStaff).toHaveBeenCalledOnce();
  });

  it.each([
    ["create", useCreateStaff, createStaff, { full_name: "New Staff" }],
    ["update", useUpdateStaff, updateStaff, { id: "s-1", full_name: "Updated" }],
    ["status update", useUpdateStaffStatus, updateStaffStatus, { id: "s-1", status: "Inactive" }],
  ] as const)("runs the %s mutation and invalidates staff", async (_name, hook, service, input) => {
    service.mockResolvedValue({ id: "s-1" });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => hook(), { wrapper });

    await act(async () => result.current.mutateAsync(input as never));

    expect(service.mock.calls[0][0]).toEqual(input);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["staff"] });
  });
});
