import { createClient } from "@/lib/supabase/client";
import type { Doctor, CreateDoctorInput, UpdateDoctorInput, } from "../types/doctor.types";

const supabase = createClient();

export async function getDoctors(): Promise<Doctor[]> {
  const { data, error } = await supabase
    .schema("medical")
    .from("doctors")
    .select("id, full_name, specialty, email, status, created_at")
    .order("full_name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Doctor[];
}

export async function createDoctor(input: CreateDoctorInput): Promise<Doctor> {
  const { data, error } = await supabase
    .schema("medical")
    .from("doctors")
    .insert({
      full_name: input.full_name,
      specialty: input.specialty,
      email: input.email,
    })
    .select("id, full_name, specialty, email, status, created_at")
    .single();

  if (error) {
    throw error;
  }

  return data as Doctor;
}

export async function updateDoctor(
  input: UpdateDoctorInput
): Promise<Doctor> {
  const { id, ...updates } = input;

  const { data, error } = await supabase
    .schema("medical")
    .from("doctors")
    .update({
      full_name: updates.full_name,
      specialty: updates.specialty,
      email: updates.email,
    })
    .eq("id", id)
    .select("id, full_name, specialty, email, status, created_at")
    .single();

  if (error) {
    throw error;
  }

  return data as Doctor;
}

export async function updateDoctorStatus(
  id: string,
  status: "Active" | "Inactive"
): Promise<Doctor> {
  const { data, error } = await supabase
    .schema("medical")
    .from("doctors")
    .update({ status })
    .eq("id", id)
    .select("id, full_name, specialty, email, status, created_at")
    .single();

  if (error) {
    throw error;
  }

  return data as Doctor;
}