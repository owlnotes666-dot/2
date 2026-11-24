export type MedicalRecordStatus = "Pending" | "Reviewed" | "Completed";

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  title: string;
  description: string | null;
  status: MedicalRecordStatus;
  created_at: string;
}

export interface MedicalRecordWithRelations extends MedicalRecord {
  patient: {
    full_name: string;
  } | null;

  doctor: {
    full_name: string;
    specialty: string;
  } | null;
}

export interface CreateMedicalRecordInput {
  patient_id: string;
  doctor_id: string;
  title: string;
  description: string;
}

export interface UpdateMedicalRecordStatusInput {
  id: string;
  status: MedicalRecordStatus;
}

export interface MedicalRecordFilters {
  search?: string;
  status?: MedicalRecordStatus | "All";
  patient_id?: string;
  doctor_id?: string;
}

export interface MedicalRecordDetails {
  id: string;
  patient_id: string;
  doctor_id: string;
  title: string;
  description: string | null;
  status: MedicalRecordStatus;
  created_at: string;

  patient: {
    full_name: string;
    age: number | null;
    gender: string | null;
    phone: string | null;
    email: string | null;
    condition: string | null;
  } | null;

  doctor: {
    full_name: string;
    specialty: string;
    email: string | null;
  } | null;
}

export interface MedicalRecordStatusHistory {
  id: string;
  entity_type: string;
  entity_id: string;
  old_status: string | null;
  new_status: string;
  changed_at: string;
}

export interface MedicalRecordDetailsResponse {
  record: MedicalRecordDetails;
  statusHistory: MedicalRecordStatusHistory[];
}
