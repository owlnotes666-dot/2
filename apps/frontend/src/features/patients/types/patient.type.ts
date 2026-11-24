export type PatientStatus = "Active" | "Inactive";
export type PatientGender = "Male" | "Female" | "Other";

export interface Patient {
  id: string;
  full_name: string;
  age: number | null;
  gender: PatientGender | null;
  phone: string | null;
  email: string | null;
  condition: string | null;
  status: PatientStatus;
  created_at: string;
}

export interface PatientPayload {
  full_name: string;
  age: number | null;
  gender: PatientGender | null;
  phone: string | null;
  email: string | null;
  condition: string | null;
  status: PatientStatus;
}

export type CreatePatientPayload = PatientPayload;

export interface UpdatePatientPayload extends PatientPayload {
  id: string;
}

export interface UpdatePatientStatusPayload {
  id: string;
  status: PatientStatus;
}