import type { Profile } from "../types/profile.type";
import { createClient } from "@/lib/supabase/client";

export type UpdateProfileInput = Partial<
  Pick<
    Profile,
  | "firstname"
  | "lastname"
  | "email"
  | "phone"
  | "bio"
  | "facebook"
  | "twitter"
  | "linkedin"
  | "instagram"
      | "country"
      | "city"
      | "postalCode"
  >
>;

export const profileService = {
  getProfile: async (): Promise<Profile | null> => {
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) return null;

    const { data, error } = await supabase
      .schema("medical")
      .from("profile")
      .select("*")
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      firstname: data.first_name,
      lastname: data.last_name,
      email: data.email,
      phone: data.phone ?? "",
      avatar: data.avatar ?? "",
      bio: data.bio ?? "",
      role: data.role,
      country: data.country ?? "",
      city: data.city ?? "",
      postalCode: data.postal_code ?? "",
      facebook: data.facebook ?? "",
      twitter: data.twitter ?? "",
      linkedin: data.linkedin ?? "",
      github: data.github ?? "",
      instagram: data.instagram ?? "",
      createdAt: data.created_at,
      isVerified: data.is_verified ?? false,
      specialty: data.specialty ?? "",
      licenseNumber: data.license_number ?? "",
      experienceYears: data.experience_years,
      hospital: data.hospital ?? "",
    };
  },

  updateProfile: async (input: UpdateProfileInput): Promise<void> => {
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) throw new Error("You must be signed in to update your profile.");

    const updates: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
    };

    if (input.firstname !== undefined) updates.first_name = input.firstname;
    if (input.lastname !== undefined) updates.last_name = input.lastname;
    if (input.email !== undefined) updates.email = input.email;
    if (input.phone !== undefined) updates.phone = input.phone || null;
    if (input.bio !== undefined) updates.bio = input.bio || null;
    if (input.facebook !== undefined) updates.facebook = input.facebook || null;
    if (input.twitter !== undefined) updates.twitter = input.twitter || null;
    if (input.linkedin !== undefined) updates.linkedin = input.linkedin || null;
    if (input.instagram !== undefined) updates.instagram = input.instagram || null;
    if (input.country !== undefined) updates.country = input.country || null;
    if (input.city !== undefined) updates.city = input.city || null;
    if (input.postalCode !== undefined) {
      updates.postal_code = input.postalCode || null;
    }

    const { error } = await supabase
      .schema("medical")
      .from("profile")
      .update(updates)
      .eq("id", user.id)
      .select("id")
      .single();

    if (error) throw error;
  },
};
