import { createClient } from "@/lib/supabase/client";
import type {
  CreatePatientPayload,
  Patient,
  UpdatePatientPayload,
  UpdatePatientStatusPayload,
} from "../types/patient.type";

const supabase = createClient();

export const patientsService = {
  async getPatients(): Promise<Patient[]> {
    const { data, error } = await supabase
      .schema("medical")
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []) as Patient[];
  },

  async createPatient(payload: CreatePatientPayload): Promise<Patient> {
    const { data, error } = await supabase
      .schema("medical")
      .from("patients")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as Patient;
  },

  async updatePatient({ id, ...payload }: UpdatePatientPayload): Promise<Patient> {
    const { data, error } = await supabase
      .schema("medical")
      .from("patients")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as Patient;
  },

  async updatePatientStatus({
    id,
    status,
  }: UpdatePatientStatusPayload): Promise<Patient> {
    const { data, error } = await supabase
      .schema("medical")
      .from("patients")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as Patient;
  },
};
