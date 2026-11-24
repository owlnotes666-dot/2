export type DoctorStatus = "Active" | "Inactive";

export interface Doctor {
  id: string;
  full_name: string;
  specialty: string;
  email: string | null;
  status: DoctorStatus;
  created_at: string;
}

export interface CreateDoctorInput {
  full_name: string;
  specialty: string;
  email: string;
}

export interface UpdateDoctorInput {
  id: string;
  full_name: string;
  specialty: string;
  email: string;
}
