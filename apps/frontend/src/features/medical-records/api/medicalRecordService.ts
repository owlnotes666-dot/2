import { createClient } from "@/lib/supabase/client";

import type {
  MedicalRecord,
  MedicalRecordWithRelations,
  CreateMedicalRecordInput,
  UpdateMedicalRecordStatusInput,
  MedicalRecordStatusHistory,
  MedicalRecordDetails,
} from "../types/medicalRecord.types";

const supabase = createClient();

export async function getMedicalRecords(): Promise<
  MedicalRecordWithRelations[]
> {
  const { data, error } = await supabase
    .schema("medical")
    .from("medical_records")
    .select(
      `
      id,
      patient_id,
      doctor_id,
      title,
      description,
      status,
      created_at,
      patient:patients (
        full_name
      ),
      doctor:doctors (
        full_name,
        specialty
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as MedicalRecordWithRelations[];
}

export async function createMedicalRecord(
  input: CreateMedicalRecordInput,
): Promise<MedicalRecord> {
  const { data, error } = await supabase
    .schema("medical")
    .from("medical_records")
    .insert({
      patient_id: input.patient_id,
      doctor_id: input.doctor_id,
      title: input.title,
      description: input.description,
    })
    .select(
      `
      id,
      patient_id,
      doctor_id,
      title,
      description,
      status,
      created_at
    `,
    )
    .single();

  if (error) {
    throw error;
  }

  return data as MedicalRecord;
}

export async function updateMedicalRecordStatus(
  input: UpdateMedicalRecordStatusInput,
): Promise<MedicalRecord> {
  const { id, status } = input;

  const { data, error } = await supabase
    .schema("medical")
    .from("medical_records")
    .update({ status })
    .eq("id", id)
    .select(
      `
      id,
      patient_id,
      doctor_id,
      title,
      description,
      status,
      created_at
    `,
    )
    .single();

  if (error) {
    throw error;
  }

  return data as MedicalRecord;
}

export async function getMedicalRecordDetails(recordId: string): Promise<{
  record: MedicalRecordDetails;
  statusHistory: MedicalRecordStatusHistory[];
}> {
  const supabase = createClient();

  const { data: record, error: recordError } = await supabase
    .schema("medical")
    .from("medical_records")
    .select(
      `
      id,
      patient_id,
      doctor_id,
      title,
      description,
      status,
      created_at,
      patient:patients (
        full_name,
        age,
        gender,
        phone,
        email,
        condition
      ),
      doctor:doctors (
        full_name,
        specialty,
        email
      )
    `,
    )
    .eq("id", recordId)
    .single();

  if (recordError) {
    throw recordError;
  }

  if (!record) {
    throw new Error("Medical record not found.");
  }

  const { data: statusHistory, error: historyError } = await supabase
    .schema("medical")
    .from("status_history")
    .select(
      `
      id,
      entity_type,
      entity_id,
      old_status,
      new_status,
      changed_at
    `,
    )
    .eq("entity_type", "medical_record")
    .eq("entity_id", recordId)
    .order("changed_at", { ascending: false });

  if (historyError) {
    throw historyError;
  }

  return {
    record: record as unknown as MedicalRecordDetails,
    statusHistory: (statusHistory ?? []) as MedicalRecordStatusHistory[],
  };
}
