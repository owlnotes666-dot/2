import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockSchema,
  mockFrom,
  mockSelect,
  mockSingle,
  mockUpdate,
  mockEq,
  mockAuthGetUser,
} = vi.hoisted(() => ({
  mockSchema: vi.fn(),
  mockFrom: vi.fn(),
  mockSelect: vi.fn(),
  mockSingle: vi.fn(),
  mockUpdate: vi.fn(),
  mockEq: vi.fn(),
  mockAuthGetUser: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    schema: mockSchema,
    auth: {
      getUser: mockAuthGetUser,
    },
  }),
}));

import { profileService } from "@/features/profile/api/profile.service";

describe("profileService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSchema.mockReturnValue({
      from: mockFrom,
    });

    mockFrom.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    });

    mockSelect.mockReturnValue({
      single: mockSingle,
    });

    mockUpdate.mockReturnValue({
      eq: mockEq,
    });

    mockEq.mockReturnValue({
      select: mockSelect,
    });

    mockAuthGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "user@example.com",
        },
      },
      error: null,
    });
  });

  describe("getProfile", () => {
    it("should get and map profile successfully", async () => {
      const databaseProfile = {
        id: "user-1",
        first_name: "Amir",
        last_name: "Test",
        email: "amir@example.com",
        phone: "123456789",
        avatar: null,
        bio: null,
        role: "admin",
        country: "Iran",
        city: "Tehran",
        postal_code: "12345",
        facebook: null,
        twitter: null,
        linkedin: null,
        github: null,
        instagram: null,
        created_at: "2026-11-17T10:00:00.000Z",
        is_verified: true,
        specialty: "Cardiology",
        license_number: "LIC-123",
        experience_years: 5,
        hospital: "Demo Hospital",
      };

      mockSingle.mockResolvedValue({
        data: databaseProfile,
        error: null,
      });

      const result = await profileService.getProfile();

      expect(mockAuthGetUser).toHaveBeenCalledTimes(1);
      expect(mockSchema).toHaveBeenCalledWith("medical");
      expect(mockFrom).toHaveBeenCalledWith("profile");
      expect(mockSelect).toHaveBeenCalledWith("*");

      expect(result).toEqual(
        expect.objectContaining({
          id: "user-1",
          firstname: "Amir",
          lastname: "Test",
          email: "amir@example.com",
          country: "Iran",
          city: "Tehran",
          postalCode: "12345",
          specialty: "Cardiology",
          licenseNumber: "LIC-123",
          experienceYears: 5,
        }),
      );
    });

    it("should return null when user is not authenticated", async () => {
      mockAuthGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await profileService.getProfile();

      expect(result).toBeNull();
      expect(mockSchema).not.toHaveBeenCalled();
    });

    it("should throw when authentication fails", async () => {
      const error = new Error("Authentication failed");

      mockAuthGetUser.mockResolvedValue({
        data: { user: null },
        error,
      });

      await expect(profileService.getProfile()).rejects.toBe(error);
    });

    it("should throw when profile query fails", async () => {
      const error = new Error("Failed to get profile");

      mockSingle.mockResolvedValue({
        data: null,
        error,
      });

      await expect(profileService.getProfile()).rejects.toBe(error);
    });

    it("should return null when profile data is missing", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await profileService.getProfile();

      expect(result).toBeNull();
    });
  });

  describe("updateProfile", () => {
    it("should update profile successfully", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "user-1" },
        error: null,
      });

      await expect(
        profileService.updateProfile({
          firstname: "Updated",
          lastname: "User",
          phone: "123456",
          city: "Tehran",
        }),
      ).resolves.toBeUndefined();

      expect(mockSchema).toHaveBeenCalledWith("medical");
      expect(mockFrom).toHaveBeenCalledWith("profile");

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: "Updated",
          last_name: "User",
          phone: "123456",
          city: "Tehran",
        }),
      );

      expect(mockEq).toHaveBeenCalledWith("id", "user-1");
    });

    it("should throw when user is not authenticated", async () => {
      mockAuthGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(
        profileService.updateProfile({
          firstname: "Updated",
        }),
      ).rejects.toThrow("You must be signed in to update your profile.");
    });

    it("should throw when update query fails", async () => {
      const error = new Error("Update failed");

      mockSingle.mockResolvedValue({
        data: null,
        error,
      });

      await expect(
        profileService.updateProfile({
          firstname: "Updated",
        }),
      ).rejects.toBe(error);
    });
  });
});
