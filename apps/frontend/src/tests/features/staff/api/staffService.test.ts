import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseQueryMock } from "@/tests/utils/supabase-query-mock";

const createClientMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/client", () => ({ createClient: createClientMock }));

const supabase = createSupabaseQueryMock();
let service: typeof import("@/features/staff/api/staffService");

beforeEach(async () => {
  vi.clearAllMocks();
  supabase.setResults({ data: [], error: null });
  createClientMock.mockReturnValue(supabase.client);
  service = await import("@/features/staff/api/staffService");
});

describe("staffService", () => {
  it("lists staff and defaults null data to an empty list", async () => {
    supabase.setResults({ data: null, error: null });
    await expect(service.getStaff()).resolves.toEqual([]);
    expect(supabase.from).toHaveBeenCalledWith("staff");
  });

  it("creates, updates, and changes staff status", async () => {
    const staffMember = { id: "s-1", full_name: "Staff" };
    supabase.setResults({ data: staffMember, error: null });
    await expect(service.createStaff({ full_name: "Staff", role: "Nurse" } as never)).resolves.toEqual(staffMember);

    supabase.setResults({ data: staffMember, error: null });
    await expect(service.updateStaff({ id: "s-1", full_name: "Staff", role: "Nurse" } as never)).resolves.toEqual(staffMember);

    supabase.setResults({ data: staffMember, error: null });
    await expect(service.updateStaffStatus({ id: "s-1", status: "Inactive" } as never)).resolves.toEqual(staffMember);
    expect(supabase.from).toHaveBeenCalledWith("staff");
  });

  it("propagates database errors", async () => {
    const error = new Error("database unavailable");
    supabase.setResults({ data: null, error });
    await expect(service.getStaff()).rejects.toBe(error);
  });
});
