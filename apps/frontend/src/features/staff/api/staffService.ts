import { createClient } from "@/lib/supabase/client";

import type {
  StaffMember,
  CreateStaffInput,
  UpdateStaffInput,
  UpdateStaffStatusInput,
} from "../types/staff.types";

export async function getStaff(): Promise<StaffMember[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .schema("medical")
    .from("staff")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as StaffMember[];
}

export async function createStaff(
  input: CreateStaffInput,
): Promise<StaffMember> {
  const supabase = createClient();

  const { data, error } = await supabase
    .schema("medical")
    .from("staff")
    .insert({
      full_name: input.full_name,
      role: input.role,
      email: input.email || null,
      phone: input.phone || null,
    })
    .select()
    .single();

  if (error) throw error;

  return data as StaffMember;
}

export async function updateStaff(
  input: UpdateStaffInput,
): Promise<StaffMember> {
  const supabase = createClient();

  const { data, error } = await supabase
    .schema("medical")
    .from("staff")
    .update({
      full_name: input.full_name,
      role: input.role,
      email: input.email || null,
      phone: input.phone || null,
    })
    .eq("id", input.id)
    .select()
    .single();

  if (error) throw error;

  return data as StaffMember;
}

export async function updateStaffStatus(
  input: UpdateStaffStatusInput,
): Promise<StaffMember> {
  const supabase = createClient();

  const { data, error } = await supabase
    .schema("medical")
    .from("staff")
    .update({ status: input.status })
    .eq("id", input.id)
    .select()
    .single();

  if (error) throw error;

  return data as StaffMember;
}
