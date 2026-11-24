import { act, renderHook } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestQueryClient } from "@/tests/utils/query-client-wrapper";

const updateProfile = vi.hoisted(() => vi.fn());
vi.mock("@/features/profile/api", () => ({
  profileService: { updateProfile },
  profileKeys: { all: ["profile"] },
}));

import { useUpdateProfile } from "@/features/profile/hooks/useUpdateProfile";

describe("useUpdateProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates the profile and invalidates cached profile data", async () => {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const input = { firstname: "Updated", city: "Tehran" };
    updateProfile.mockResolvedValue(undefined);
    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    await act(async () => result.current.mutateAsync(input));

    expect(updateProfile.mock.calls[0][0]).toEqual(input);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["profile"] });
  });
});
